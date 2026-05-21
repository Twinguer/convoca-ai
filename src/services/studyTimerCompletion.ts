import { UserStudyService } from '@/services/userStudyService';
import { calculateStudyStatistics } from '@/utils/userStudyHelpers';
import { resolveStudySessions } from '@/utils/studyStatisticsMerge';
import { generateId } from '@/lib/utils';
import type { PendingTimerTask } from '@/utils/timerTaskContext';

/**
 * Registra tempo verificado pelo timer na tarefa do cronograma e em study_sessions (tipo timer).
 */
export async function completeScheduleTaskFromTimer(
  userId: string,
  task: PendingTimerTask,
  durationMinutes: number
): Promise<boolean> {
  if (durationMinutes < 1) return false;

  try {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const userStudyData = await UserStudyService.getUserStudyData(userId, true);
    if (!userStudyData) return false;

    const cycle = userStudyData.study_cycles.find((c) => c.id === task.cycleId);
    if (!cycle) return false;

    let session = userStudyData.study_schedule?.find((s) => s.id === task.scheduleSessionId);
    if (!session) {
      const daySchedule = cycle.schedule_data?.weekly_schedule?.find(
        (d: { day?: number }) => d.day === task.dayOfWeek
      );
      session = daySchedule?.sessions?.find((s: { id?: string }) => s.id === task.scheduleSessionId);
    }

    if (!session) return false;

    const disciplineName = session.discipline_name ?? task.disciplineName;
    const blockName = session.block_name ?? task.blockName;

    let updatedStudySessions = [...(userStudyData.study_sessions || [])];

    if (durationMinutes >= 20) {
      const newCompletedSession = {
        id: generateId(),
        schedule_session_id: task.scheduleSessionId,
        cycle_id: task.cycleId,
        date: localDate,
        duration_minutes: durationMinutes,
        questions: 0,
        correct_answers: 0,
        notes: '',
        course_name: '',
        session_link: session.session_link,
        discipline_name: disciplineName,
        block_name: blockName,
        study_type: 'timer',
        session_date: localDate,
        start_time: session.start_time,
        end_time: session.end_time,
        session_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updatedStudySessions = [...updatedStudySessions, newCompletedSession];
    }

    const updatedSchedule = (userStudyData.study_schedule || []).map((s) => {
      if (s.id !== task.scheduleSessionId) return s;
      const currentStats = s.total_stats || {
        total_duration_minutes: 0,
        total_questions: 0,
        total_correct: 0,
        session_count: 0,
      };
      return {
        ...s,
        total_stats: {
          total_duration_minutes:
            currentStats.total_duration_minutes + durationMinutes,
          total_questions: currentStats.total_questions,
          total_correct: currentStats.total_correct,
          session_count: currentStats.session_count + 1,
          last_session_date: localDate,
        },
      };
    });

    const sessionsForStats = resolveStudySessions(
      updatedStudySessions,
      userStudyData.study_statistics
    );
    const calculatedStats = calculateStudyStatistics(sessionsForStats);

    UserStudyService.clearCache(userId);
    return await UserStudyService.upsertUserStudyData(userId, {
      study_sessions: updatedStudySessions,
      study_statistics: calculatedStats,
      study_schedule: updatedSchedule,
    });
  } catch {
    return false;
  }
}
