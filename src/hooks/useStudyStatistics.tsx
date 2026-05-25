import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyStatistics, defaultUserStudy, StudySession } from '@/types/userStudy';
import {
  getFilteredPeriodSummary,
  type StudyTimeFilter,
} from '@/utils/studyStatisticsFilters';
import {
  resolveStudySessions,
  resolveStudyStatistics,
} from '@/utils/studyStatisticsMerge';
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
    resetStatistics,
    getFilteredStats,
    refreshStatistics: loadStatistics,
  };
};
