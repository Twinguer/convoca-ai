import { 
  StudySession, 
  StudySchedule, 
  StudyStatistics, 
  StudyCycleV2,
  StudyPlan,
  StudySubject,
  StudyGoal,
  StudyGoalsTracking,
  StudyProgress,
  StudyReminder,
  SpacedRepetitionItem,
  UserStudyDay,
  StudyContest,
  SessionProgress,
  UserStudy
} from '@/types/userStudy';

/**
 * Helper functions for manipulating user study data
 * These functions provide utilities for working with JSONB data structures
 */

// ===== STUDY SESSIONS HELPERS =====

/**
 * Create a new study session from session progress
 */
export function createStudySessionFromProgress(
  progress: SessionProgress,
  scheduleSessionId?: string,
  sessionLink?: string
): Omit<StudySession, 'id' | 'created_at' | 'updated_at'> {
  const now = new Date();
  const sessionDate = now.toISOString().split('T')[0];
  const startTime = now.toTimeString().split(' ')[0];

  return {
    schedule_session_id: scheduleSessionId,
    session_link: sessionLink,
    total_duration_minutes: progress.duration,
    total_questions: progress.questions,
    total_correct_answers: progress.correctAnswers,
    session_count: 1,
    last_session_date: sessionDate,
    session_date: sessionDate,
    start_time: startTime,
    end_time: new Date(now.getTime() + progress.duration * 60000).toTimeString().split(' ')[0],
    duration_minutes: progress.duration,
    notes: progress.notes,
    study_type: progress.studyType,
    quality_rating: undefined,
    study_plan_id: undefined,
    subject_id: undefined,
    study_contest_id: undefined
  };
}

/**
 * Update session with new progress
 */
export function updateSessionWithProgress(
  session: StudySession,
  progress: SessionProgress
): StudySession {
  const newDuration = session.duration_minutes + progress.duration;
  const newQuestions = session.total_questions + progress.questions;
  const newCorrectAnswers = session.total_correct_answers + progress.correctAnswers;
  const newSessionCount = session.session_count + 1;

  return {
    ...session,
    total_duration_minutes: newDuration,
    total_questions: newQuestions,
    total_correct_answers: newCorrectAnswers,
    session_count: newSessionCount,
    last_session_date: new Date().toISOString().split('T')[0],
    duration_minutes: newDuration,
    notes: progress.notes || session.notes,
    updated_at: new Date().toISOString()
  };
}

/**
 * Calculate session statistics
 */
export function calculateSessionStats(sessions: StudySession[]) {
  const totalDuration = sessions.reduce((sum, session) => sum + session.total_duration_minutes, 0);
  const totalQuestions = sessions.reduce((sum, session) => sum + session.total_questions, 0);
  const totalCorrectAnswers = sessions.reduce((sum, session) => sum + session.total_correct_answers, 0);
  const totalSessions = sessions.length;

  return {
    totalDuration,
    totalQuestions,
    totalCorrectAnswers,
    totalSessions,
    averageAccuracy: totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0,
    averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0
  };
}

// ===== STUDY SCHEDULE HELPERS =====

/**
 * Create a new schedule session
 */
export function createScheduleSession(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  disciplineName?: string,
  blockName?: string,
  cycleId?: string,
  sessionLink?: string,
  studyPlanId?: string,
  subjectId?: string
): Omit<StudySchedule, 'id' | 'created_at' | 'updated_at'> {
  return {
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    is_active: true,
    discipline_name: disciplineName,
    block_name: blockName,
    cycle_id: cycleId,
    session_link: sessionLink,
    study_plan_id: studyPlanId,
    subject_id: subjectId
  };
}

/**
 * Get active schedule sessions for a specific day
 */
export function getActiveScheduleForDay(schedule: StudySchedule[], dayOfWeek: number): StudySchedule[] {
  return schedule.filter(session => 
    session.day_of_week === dayOfWeek && session.is_active
  );
}

/**
 * Get schedule sessions for a specific cycle
 */
export function getScheduleForCycle(schedule: StudySchedule[], cycleId: string): StudySchedule[] {
  return schedule.filter(session => session.cycle_id === cycleId);
}

// ===== STUDY STATISTICS HELPERS =====

/**
 * Calculate study statistics from sessions
 */
export function calculateStudyStatistics(sessions: StudySession[]): StudyStatistics {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Basic calculations
  const totalHours = sessions.reduce((sum, session) => sum + (session.total_duration_minutes / 60), 0);
  const totalSessions = sessions.length;
  const questionsAnswered = sessions.reduce((sum, session) => sum + session.total_questions, 0);
  const correctAnswers = sessions.reduce((sum, session) => sum + session.total_correct_answers, 0);
  const wrongAnswers = questionsAnswered - correctAnswers;

  // Calculate streaks
  const sortedSessions = sessions
    .sort((a, b) => new Date(b.last_session_date).getTime() - new Date(a.last_session_date).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.last_session_date);
    
    if (lastDate === null) {
      lastDate = sessionDate;
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        tempStreak++;
      } else if (daysDiff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        if (currentStreak === 0) currentStreak = tempStreak;
        tempStreak = 1;
      }
    }
    
    lastDate = sessionDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  if (currentStreak === 0) currentStreak = tempStreak;

  // Calculate daily, weekly, and monthly stats
  const dailyStats: Record<string, { hours: number; sessions: number }> = {};
  const weeklyStats: Record<string, { hours: number; sessions: number }> = {};
  const monthlyStats: Record<string, { hours: number; sessions: number }> = {};

  sessions.forEach(session => {
    const sessionDate = new Date(session.last_session_date);
    const dateStr = session.last_session_date;
    const weekStr = getWeekString(sessionDate);
    const monthStr = sessionDate.toISOString().substring(0, 7);

    const hours = session.total_duration_minutes / 60;

    // Daily stats
    if (!dailyStats[dateStr]) {
      dailyStats[dateStr] = { hours: 0, sessions: 0 };
    }
    dailyStats[dateStr].hours += hours;
    dailyStats[dateStr].sessions += 1;

    // Weekly stats
    if (!weeklyStats[weekStr]) {
      weeklyStats[weekStr] = { hours: 0, sessions: 0 };
    }
    weeklyStats[weekStr].hours += hours;
    weeklyStats[weekStr].sessions += 1;

    // Monthly stats
    if (!monthlyStats[monthStr]) {
      monthlyStats[monthStr] = { hours: 0, sessions: 0 };
    }
    monthlyStats[monthStr].hours += hours;
    monthlyStats[monthStr].sessions += 1;
  });

  // Calculate averages
  const dailyEntries = Object.values(dailyStats);
  const weeklyEntries = Object.values(weeklyStats);
  const monthlyEntries = Object.values(monthlyStats);

  const dailyHours = dailyEntries.length > 0 
    ? dailyEntries.reduce((sum, day) => sum + day.hours, 0) / dailyEntries.length 
    : 0;
  const weeklyHours = weeklyEntries.length > 0 
    ? weeklyEntries.reduce((sum, week) => sum + week.hours, 0) / weeklyEntries.length 
    : 0;
  const monthlyHours = monthlyEntries.length > 0 
    ? monthlyEntries.reduce((sum, month) => sum + month.hours, 0) / monthlyEntries.length 
    : 0;

  // Create session history
  const sessionHistory = sessions.map(session => ({
    date: session.last_session_date,
    duration: session.total_duration_minutes / 60,
    type: 'timer' as const,
    subject: session.discipline_name
  }));

  // Calculate subject stats
  const subjectStats: Record<string, {
    totalHours: number;
    totalSessions: number;
    questionsAnswered: number;
    correctAnswers: number;
    wrongAnswers: number;
  }> = {};

  sessions.forEach(session => {
    const subject = session.discipline_name || 'Unknown';
    if (!subjectStats[subject]) {
      subjectStats[subject] = {
        totalHours: 0,
        totalSessions: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        wrongAnswers: 0
      };
    }

    const hours = session.total_duration_minutes / 60;
    subjectStats[subject].totalHours += hours;
    subjectStats[subject].totalSessions += 1;
    subjectStats[subject].questionsAnswered += session.total_questions;
    subjectStats[subject].correctAnswers += session.total_correct_answers;
    subjectStats[subject].wrongAnswers += (session.total_questions - session.total_correct_answers);
  });

  return {
    totalHours,
    totalSessions,
    questionsAnswered,
    correctAnswers,
    wrongAnswers,
    currentStreak,
    longestStreak,
    lastStudyDate: sessions.length > 0 ? sortedSessions[0].last_session_date : null,
    dailyStats,
    weeklyStats,
    monthlyStats,
    averages: {
      dailyHours,
      weeklyHours,
      monthlyHours
    },
    sessionHistory,
    subjectStats,
    lastUpdated: now.toISOString()
  };
}

/**
 * Get week string for a date (YYYY-WW format)
 */
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Get week number for a date
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// ===== STUDY CYCLES HELPERS =====

/**
 * Create a new study cycle V2
 */
export function createStudyCycleV2(
  cycleName: string,
  examDate: string,
  organ?: string,
  position?: string,
  editalLink?: string,
  cursoLink?: string,
  videoLink?: string,
  blocks?: Array<{
    id: string;
    name: string;
    disciplines: Array<{
      id: string;
      name: string;
    }>;
  }>
): Omit<StudyCycleV2, 'id' | 'created_at' | 'updated_at'> {
  // Debug: Verificar blocos recebidos

  // Criar disciplinas disponíveis a partir dos blocos
  const availableDisciplines = blocks?.flatMap(block => 
    block.disciplines.map(discipline => ({
      id: discipline.id,
      name: discipline.name,
      block_name: block.name
    }))
  ) || [];


  const result = {
    cycle_name: cycleName,
    exam_date: examDate,
    organ,
    position,
    edital_link: editalLink,
    curso_link: cursoLink,
    video_link: videoLink,
    is_active: true,
    schedule_data: {
      weekly_schedule: [],
      metadata: {
        total_sessions: 0,
        total_hours: 0
      },
      available_blocks: blocks || [],
      available_disciplines: availableDisciplines
    }
  };


  return result;
}

// ===== STUDY PLANS HELPERS =====

/**
 * Create a new study plan
 */
export function createStudyPlan(
  title: string,
  startDate: string,
  dailyGoalHours: number,
  weeklyGoalHours: number,
  description?: string,
  endDate?: string
): Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'> {
  return {
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    daily_goal_hours: dailyGoalHours,
    weekly_goal_hours: weeklyGoalHours,
    is_active: true
  };
}

// ===== STUDY SUBJECTS HELPERS =====

/**
 * Create a new study subject
 */
export function createStudySubject(
  name: string,
  color: string,
  priority: number,
  weeklyHours: number,
  blockName?: string,
  estimatedHours?: number
): Omit<StudySubject, 'id' | 'created_at' | 'updated_at'> {
  return {
    name,
    color,
    priority,
    weekly_hours: weeklyHours,
    is_active: true,
    block_name: blockName,
    is_completed: false,
    estimated_hours: estimatedHours
  };
}

// ===== STUDY GOALS HELPERS =====

/**
 * Create a new study goal
 */
export function createStudyGoal(
  goalType: string,
  targetValue: number,
  unitType: string,
  description?: string,
  targetDate?: string
): Omit<StudyGoal, 'id' | 'created_at' | 'updated_at'> {
  return {
    goal_type: goalType,
    target_value: targetValue,
    current_value: 0,
    unit_type: unitType,
    target_date: targetDate,
    description,
    is_completed: false
  };
}

/**
 * Create goals tracking structure
 */
export function createGoalsTracking(
  dailyGoalHours?: number,
  weeklyGoalHours?: number
): StudyGoalsTracking {
  const tracking: StudyGoalsTracking = {};

  if (dailyGoalHours !== undefined) {
    tracking.daily = {
      goal_type: 'daily_hours',
      target_hours: dailyGoalHours,
      current_streak: 0,
      longest_streak: 0,
      is_active: true
    };
  }

  if (weeklyGoalHours !== undefined) {
    tracking.weekly = {
      goal_type: 'weekly_hours',
      target_hours: weeklyGoalHours,
      current_streak: 0,
      longest_streak: 0,
      is_active: true
    };
  }

  return tracking;
}

// ===== STUDY PROGRESS HELPERS =====

/**
 * Create a new study progress entry
 */
export function createStudyProgress(
  progressDate: string,
  hoursStudied: number,
  topicsCompleted: number,
  subjectId?: string,
  notes?: string
): Omit<StudyProgress, 'id' | 'created_at' | 'updated_at'> {
  return {
    subject_id: subjectId,
    progress_date: progressDate,
    hours_studied: hoursStudied,
    topics_completed: topicsCompleted,
    notes
  };
}

// ===== STUDY REMINDERS HELPERS =====

/**
 * Create a new study reminder
 */
export function createStudyReminder(
  title: string,
  description?: string,
  reminderTime?: string
): Omit<StudyReminder, 'id' | 'created_at' | 'updated_at'> {
  return {
    title,
    description,
    reminder_time: reminderTime,
    is_active: true
  };
}

// ===== SPACED REPETITION HELPERS =====

/**
 * Create a new spaced repetition item
 */
export function createSpacedRepetitionItem(
  subjectName: string,
  difficultyLevel: number,
  nextReviewDate: string,
  blockName?: string
): Omit<SpacedRepetitionItem, 'id' | 'created_at' | 'updated_at'> {
  return {
    subject_name: subjectName,
    block_name: blockName,
    difficulty_level: difficultyLevel,
    next_review_date: nextReviewDate,
    review_count: 0
  };
}

// ===== USER STUDY DAYS HELPERS =====

/**
 * Create a new user study day
 */
export function createUserStudyDay(studyDate: string): Omit<UserStudyDay, 'id' | 'created_at'> {
  return {
    study_date: studyDate
  };
}

// ===== STUDY CONTESTS HELPERS =====

/**
 * Create a new study contest
 */
export function createStudyContest(
  title: string,
  startDate: string,
  description?: string,
  endDate?: string
): Omit<StudyContest, 'id' | 'created_at' | 'updated_at'> {
  return {
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    is_active: true
  };
}

// ===== GENERAL HELPERS =====

/**
 * Check if a date is today
 */
export function isToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date === yesterday.toISOString().split('T')[0];
}

/**
 * Get date string for today
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string for yesterday
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Format duration in minutes to hours and minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Format duration in minutes to decimal hours
 */
export function formatDurationDecimal(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0;
}

/**
 * Format accuracy as percentage string
 */
export function formatAccuracy(correct: number, total: number): string {
  const accuracy = calculateAccuracy(correct, total);
  return `${accuracy.toFixed(1)}%`;
}

