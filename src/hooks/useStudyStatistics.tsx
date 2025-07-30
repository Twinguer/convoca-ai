import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StudyStatistics {
  totalHours: number;
  totalSessions: number;
  questionsAnswered: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  dailyStats: Record<string, { hours: number; sessions: number }>;
  weeklyStats: Record<string, { hours: number; sessions: number }>;
  monthlyStats: Record<string, { hours: number; sessions: number }>;
  averages: {
    dailyHours: number;
    weeklyHours: number;
    monthlyHours: number;
  };
  sessionHistory: Array<{
    date: string;
    duration: number;
    type: 'timer' | 'manual';
  }>;
  lastUpdated: string | null;
}

const defaultStats: StudyStatistics = {
  totalHours: 0,
  totalSessions: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  dailyStats: {},
  weeklyStats: {},
  monthlyStats: {},
  averages: {
    dailyHours: 0,
    weeklyHours: 0,
    monthlyHours: 0
  },
  sessionHistory: [],
  lastUpdated: null
};

export const useStudyStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<StudyStatistics>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  const loadStatistics = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('study_statistics')
        .select('statistics_data')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading statistics:', error);
        return;
      }

      if (data) {
        setStatistics(data.statistics_data as StudyStatistics);
      } else {
        // Criar registro inicial
        await createInitialStatistics();
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createInitialStatistics = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_statistics')
        .insert({
          user_id: user.id,
          statistics_data: defaultStats
        });

      if (error) {
        console.error('Error creating initial statistics:', error);
      }
    } catch (error) {
      console.error('Error creating initial statistics:', error);
    }
  };

  const updateStatistics = async (newStats: Partial<StudyStatistics>) => {
    if (!user) return;

    const updatedStats = { ...statistics, ...newStats };
    setStatistics(updatedStats);

    try {
      const { error } = await supabase
        .from('study_statistics')
        .upsert({
          user_id: user.id,
          statistics_data: updatedStats
        });

      if (error) {
        console.error('Error updating statistics:', error);
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  };

  const addStudySession = async (durationMinutes: number) => {
    if (!user || durationMinutes < 20) return; // Só conta sessões > 20min

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hours = durationMinutes / 60;

    // Calcular streak
    let newCurrentStreak = statistics.currentStreak;
    const lastStudyDate = statistics.lastStudyDate;
    
    if (lastStudyDate) {
      const lastDate = new Date(lastStudyDate);
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newCurrentStreak += 1;
      } else if (diffDays > 1) {
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }

    // Atualizar estatísticas diárias
    const newDailyStats = { ...statistics.dailyStats };
    if (!newDailyStats[today]) {
      newDailyStats[today] = { hours: 0, sessions: 0 };
    }
    newDailyStats[today].hours += hours;
    newDailyStats[today].sessions += 1;

    // Calcular médias
    const totalDays = Object.keys(newDailyStats).length;
    const totalHours = statistics.totalHours + hours;
    const dailyAverage = totalHours / totalDays;

    const newStats: Partial<StudyStatistics> = {
      totalHours: totalHours,
      totalSessions: statistics.totalSessions + 1,
      currentStreak: newCurrentStreak,
      longestStreak: Math.max(statistics.longestStreak, newCurrentStreak),
      lastStudyDate: today,
      dailyStats: newDailyStats,
      averages: {
        ...statistics.averages,
        dailyHours: dailyAverage
      },
      sessionHistory: [
        ...statistics.sessionHistory,
        {
          date: now.toISOString(),
          duration: durationMinutes,
          type: 'timer' as const
        }
      ].slice(-100) // Manter apenas últimas 100 sessões
    };

    await updateStatistics(newStats);
  };

  const addQuestionResult = async (isCorrect: boolean) => {
    if (!user) return;

    const newStats: Partial<StudyStatistics> = {
      questionsAnswered: statistics.questionsAnswered + 1,
      correctAnswers: statistics.correctAnswers + (isCorrect ? 1 : 0),
      wrongAnswers: statistics.wrongAnswers + (isCorrect ? 0 : 1)
    };

    await updateStatistics(newStats);
  };

  const resetStatistics = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_statistics')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting statistics:', error);
        return;
      }

      setStatistics(defaultStats);
      await createInitialStatistics();
    } catch (error) {
      console.error('Error resetting statistics:', error);
    }
  };

  const getFilteredStats = (filter: 'day' | 'week' | 'month') => {
    const now = new Date();
    let startDate: Date;

    switch (filter) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const filteredSessions = statistics.sessionHistory.filter(session => 
      new Date(session.date) >= startDate
    );

    const totalHours = filteredSessions.reduce((sum, session) => 
      sum + (session.duration / 60), 0
    );

    return {
      hours: totalHours,
      sessions: filteredSessions.length,
      average: totalHours / (filter === 'day' ? 1 : filter === 'week' ? 7 : 30)
    };
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
    refreshStatistics: loadStatistics
  };
};