import { StudySchedule, StudyCycleV2, UserStudy } from '@/types/userStudy';

/**
 * Helper functions for managing study schedule sessions
 * Supports both new (study_schedule) and legacy (study_cycles.weekly_schedule) structures
 */

/**
 * Get schedule sessions from study_schedule or fallback to legacy structure
 * @param userStudy - Complete user study data
 * @param cycleId - Optional cycle ID filter
 * @param dayOfWeek - Optional day of week filter (0-6)
 * @returns Array of schedule sessions
 */
export function getScheduleSessions(
  userStudy: UserStudy,
  cycleId?: string,
  dayOfWeek?: number
): StudySchedule[] {
  const sessions: StudySchedule[] = [];
  
  // 1. Primary source: study_schedule
  if (userStudy.study_schedule && userStudy.study_schedule.length > 0) {
    userStudy.study_schedule.forEach(session => {
      // Apply filters
      if (cycleId && session.cycle_id !== cycleId) return;
      if (dayOfWeek !== undefined && session.day_of_week !== dayOfWeek) return;
      
      sessions.push(session);
    });
  }
  
  // 2. Fallback: legacy structure in study_cycles.schedule_data.weekly_schedule
  if (sessions.length === 0 && userStudy.study_cycles && userStudy.study_cycles.length > 0) {
    userStudy.study_cycles.forEach(cycle => {
      // Apply cycle filter
      if (cycleId && cycle.id !== cycleId) return;
      
      const weeklySchedule = cycle.schedule_data?.weekly_schedule;
      if (weeklySchedule && Array.isArray(weeklySchedule)) {
        weeklySchedule.forEach(dayData => {
          // Apply day filter
          if (dayOfWeek !== undefined && dayData.day !== dayOfWeek) return;
          
          if (dayData.sessions && Array.isArray(dayData.sessions)) {
            dayData.sessions.forEach(session => {
              sessions.push({
                id: session.id,
                schedule_session_id: session.id,
                cycle_id: cycle.id,
                day_of_week: dayData.day,
                start_time: session.start_time,
                end_time: session.end_time,
                discipline_name: session.discipline_name,
                block_name: session.block_name,
                session_link: session.session_link,
                study_plan_id: session.study_plan_id,
                subject_id: session.subject_id,
                total_stats: session.total_stats,
                created_at: session.created_at || new Date().toISOString(),
                updated_at: session.updated_at || new Date().toISOString()
              });
            });
          }
        });
      }
    });
  }
  
  return sessions;
}

/**
 * Format session data for saving to study_schedule
 * @param session - Partial session data
 * @param cycleId - Cycle ID reference
 * @param dayOfWeek - Day of week (0-6)
 * @returns Complete StudySchedule object
 */
export function formatSessionForSchedule(
  session: Partial<StudySchedule>,
  cycleId: string,
  dayOfWeek: number
): StudySchedule {
  return {
    id: session.id || crypto.randomUUID(),
    schedule_session_id: session.schedule_session_id,
    cycle_id: cycleId,
    day_of_week: dayOfWeek,
    start_time: session.start_time!,
    end_time: session.end_time!,
    discipline_name: session.discipline_name,
    block_name: session.block_name,
    session_link: session.session_link,
    study_plan_id: session.study_plan_id,
    subject_id: session.subject_id,
    total_stats: session.total_stats || {
      session_count: 0,
      total_duration_minutes: 0,
      total_questions: 0,
      total_correct: 0,
      last_session_date: ''
    },
    created_at: session.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Group sessions by day of week
 * @param sessions - Array of schedule sessions
 * @returns Map of day => sessions
 */
export function groupSessionsByDay(sessions: StudySchedule[]): Map<number, StudySchedule[]> {
  const grouped = new Map<number, StudySchedule[]>();
  
  sessions.forEach(session => {
    const day = session.day_of_week;
    if (!grouped.has(day)) {
      grouped.set(day, []);
    }
    grouped.get(day)!.push(session);
  });
  
  // Sort sessions by start_time within each day
  grouped.forEach((daySessions, day) => {
    grouped.set(day, daySessions.sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    ));
  });
  
  return grouped;
}

/**
 * Get sessions for a specific cycle grouped by day
 * @param userStudy - Complete user study data
 * @param cycleId - Cycle ID
 * @returns Map of day => sessions
 */
export function getCycleScheduleByDay(
  userStudy: UserStudy,
  cycleId: string
): Map<number, StudySchedule[]> {
  const sessions = getScheduleSessions(userStudy, cycleId);
  return groupSessionsByDay(sessions);
}

/**
 * Check if a session exists in schedule
 * @param userStudy - Complete user study data
 * @param sessionId - Session ID
 * @returns boolean
 */
export function sessionExistsInSchedule(
  userStudy: UserStudy,
  sessionId: string
): boolean {
  const allSessions = getScheduleSessions(userStudy);
  return allSessions.some(s => s.id === sessionId);
}

/**
 * Get session by ID
 * @param userStudy - Complete user study data
 * @param sessionId - Session ID
 * @returns StudySchedule or null
 */
export function getSessionById(
  userStudy: UserStudy,
  sessionId: string
): StudySchedule | null {
  const allSessions = getScheduleSessions(userStudy);
  return allSessions.find(s => s.id === sessionId) || null;
}
