import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyStatistics, defaultUserStudy, StudySession } from '@/types/userStudy';
import { calculateStudyStatistics } from '@/utils/userStudyHelpers';
import {
  getFilteredPeriodSummary,
  type StudyTimeFilter,
} from '@/utils/studyStatisticsFilters';
import {
  resolveStudySessions,
  resolveStudyStatistics,
  findOrCreateQuestionTrackerSession,
  QUESTION_TRACKER_SUBJECT,
} from '@/utils/studyStatisticsMerge';
import { toLocalDateKey } from '@/utils/studyStatisticsFilters';
import { generateId } from '@/lib/utils';
import { devLog } from '@/utils/productionLogger';

let globalPersistInProgress = false;

export const useStudyStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<StudyStatistics>(
    defaultUserStudy.study_statistics as StudyStatistics
  );
  const [isLoading, setIsLoading] = useState(true);
  const persistSessionsAndStats = useCallback(
    async (sessions: StudySession[], stats: StudyStatistics) => {
      if (!user) return false;
      if (globalPersistInProgress) return false;

      globalPersistInProgress = true;
      try {
        const ok = await UserStudyService.saveSessionsAndStatistics(user.id, sessions, stats);
        if (!ok) {
          devLog.error('Error persisting study statistics');
        }
        return ok;
      } finally {
        globalPersistInProgress = false;
      }
    },
    [user]
  );

  const loadStatistics = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      UserStudyService.clearCache(user.id);
      const userStudyData = await UserStudyService.getUserStudyData(user.id, true);

      if (!userStudyData) {
        setStatistics(defaultUserStudy.study_statistics as StudyStatistics);
        return;
      }

      const sessions = resolveStudySessions(
        userStudyData.study_sessions,
        userStudyData.study_statistics
      );
      const resolvedStats = resolveStudyStatistics(
        sessions,
        userStudyData.study_statistics
      );

      setStatistics(resolvedStats);

      // Migrar histórico legado para study_sessions uma única vez (sem dupla contagem)
      const rawCount = userStudyData.study_sessions?.length ?? 0;
      const mergedOrphans = sessions.length > rawCount;
      const importedFromHistory = rawCount === 0 && sessions.length > 0;
      if (importedFromHistory || mergedOrphans) {
        persistSessionsAndStats(sessions, resolvedStats).catch((err) => {
          devLog.error('Error persisting merged study sessions:', err);
        });
      }
    } catch (error) {
      devLog.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addStudySession = async (
    durationMinutes: number,
    type: 'timer' | 'manual' = 'timer',
    subject?: string
  ) => {
    if (!user || durationMinutes < 20) return;

    try {
      UserStudyService.clearCache(user.id);
      const userStudyData = await UserStudyService.getUserStudyData(user.id, true);
      const existingSessions = resolveStudySessions(
        userStudyData?.study_sessions,
        userStudyData?.study_statistics
      );

      const now = new Date();
      const today = toLocalDateKey(now);

      const newSession: StudySession = {
        id: generateId(),
        duration_minutes: durationMinutes,
        questions: 0,
        correct_answers: 0,
        session_date: today,
        discipline_name: subject?.trim() || 'Sem Disciplina',
        study_type: type,
        session_count: 1,
        start_time: now.toTimeString().split(' ')[0],
        end_time: new Date(now.getTime() + durationMinutes * 60000)
          .toTimeString()
          .split(' ')[0],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const updatedSessions = [...existingSessions, newSession];
      const calculatedStats = calculateStudyStatistics(updatedSessions);

      setStatistics(calculatedStats);
      await persistSessionsAndStats(updatedSessions, calculatedStats);
    } catch (error) {
      devLog.error('Error adding study session:', error);
    }
  };

  const addQuestionResult = async (isCorrect: boolean, subject?: string) => {
    if (!user) return;

    try {
      UserStudyService.clearCache(user.id);
      const userStudyData = await UserStudyService.getUserStudyData(user.id, true);
      let sessions = resolveStudySessions(
        userStudyData?.study_sessions,
        userStudyData?.study_statistics
      );

      const today = toLocalDateKey(new Date());
      const discipline = subject?.trim() || QUESTION_TRACKER_SUBJECT;

      let targetIndex = sessions.findIndex((s) => {
        const d = s.session_date ?? s.date ?? s.last_session_date;
        return (
          d &&
          toLocalDateKey(d) === today &&
          (s.discipline_name ?? '') === discipline &&
          (s.duration_minutes ?? s.total_duration_minutes ?? 0) === 0
        );
      });

      if (targetIndex < 0 && discipline === QUESTION_TRACKER_SUBJECT) {
        const created = findOrCreateQuestionTrackerSession(sessions, today);
        sessions = created.sessions;
        targetIndex = created.index;
      } else if (targetIndex < 0) {
        sessions = [
          ...sessions,
          {
            id: generateId(),
            duration_minutes: 0,
            questions: 0,
            correct_answers: 0,
            session_date: today,
            discipline_name: discipline,
            study_type: 'manual',
            session_count: 1,
            start_time: '00:00:00',
            created_at: new Date().toISOString(),
          },
        ];
        targetIndex = sessions.length - 1;
      }

      const current = sessions[targetIndex];
      const prevQuestions =
        current.questions ?? current.total_questions ?? 0;
      const prevCorrect =
        current.correct_answers ?? current.total_correct_answers ?? 0;

      sessions = sessions.map((s, i) =>
        i === targetIndex
          ? {
              ...s,
              questions: prevQuestions + 1,
              correct_answers: prevCorrect + (isCorrect ? 1 : 0),
              total_questions: prevQuestions + 1,
              total_correct_answers: prevCorrect + (isCorrect ? 1 : 0),
              updated_at: new Date().toISOString(),
            }
          : s
      );

      const calculatedStats = calculateStudyStatistics(sessions);
      setStatistics(calculatedStats);
      await persistSessionsAndStats(sessions, calculatedStats);
    } catch (error) {
      devLog.error('Error adding question result:', error);
    }
  };

  const resetStatistics = async () => {
    if (!user) return;

    try {
      await UserStudyService.deleteUserStudyData(user.id);
      await UserStudyService.initializeUserStudyData(user.id);
      setStatistics(defaultUserStudy.study_statistics as StudyStatistics);
    } catch (error) {
      devLog.error('Error resetting statistics:', error);
    }
  };

  const getFilteredStats = (filter: StudyTimeFilter) => {
    return getFilteredPeriodSummary(statistics, filter);
  };

  useEffect(() => {
    loadStatistics();
  }, [user?.id]);

  return {
    statistics,
    isLoading,
    addStudySession,
    addQuestionResult,
    resetStatistics,
    getFilteredStats,
    refreshStatistics: loadStatistics,
  };
};
