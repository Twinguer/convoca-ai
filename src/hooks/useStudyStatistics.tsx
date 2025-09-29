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
    subject?: string;
  }>;
  subjectStats: Record<string, {
    totalHours: number;
    totalSessions: number;
    questionsAnswered: number;
    correctAnswers: number;
    wrongAnswers: number;
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
  subjectStats: {},
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
      // Buscar estatísticas existentes
      const { data: statsData, error: statsError } = await supabase
        .from('study_statistics')
        .select('statistics_data')
        .eq('user_id', user.id)
        .single();

      // Buscar sessões de estudo do cronograma com informações da disciplina
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_schedule (
            discipline_name,
            block_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error loading statistics:', statsError);
        return;
      }

      let baseStats = defaultStats;
      
      if (statsData?.statistics_data) {
        const stats = statsData.statistics_data as StudyStatistics;
        baseStats = {
          ...defaultStats,
          ...stats,
          averages: {
            ...defaultStats.averages,
            ...stats.averages
          }
        };
      }

      // Consolidar com dados das sessões do cronograma
      if (sessionsData && sessionsData.length > 0) {
        let consolidatedStats = { ...baseStats };
        
        // Somar horas das sessões
        const totalSessionHours = sessionsData.reduce((sum, session) => 
          sum + (session.total_duration_minutes / 60), 0
        );
        
        // Somar questões das sessões
        const totalSessionQuestions = sessionsData.reduce((sum, session) => 
          sum + (session.total_questions || 0), 0
        );
        
        const totalCorrectAnswers = sessionsData.reduce((sum, session) => 
          sum + (session.total_correct_answers || 0), 0
        );

        // Contar sessões totais
        const totalSessionsFromSchedule = sessionsData.reduce((sum, session) => 
          sum + (session.session_count || 0), 0
        );

        // Processar estatísticas por disciplina
        const subjectStats: Record<string, {
          totalHours: number;
          totalSessions: number;
          questionsAnswered: number;
          correctAnswers: number;
          wrongAnswers: number;
        }> = {};

        sessionsData.forEach(session => {
          const disciplineName = session.study_schedule?.discipline_name || session.study_schedule?.block_name;
          
          if (disciplineName) {
            if (!subjectStats[disciplineName]) {
              subjectStats[disciplineName] = {
                totalHours: 0,
                totalSessions: 0,
                questionsAnswered: 0,
                correctAnswers: 0,
                wrongAnswers: 0
              };
            }
            
            const hours = session.total_duration_minutes / 60;
            const questions = session.total_questions || 0;
            const correct = session.total_correct_answers || 0;
            const wrong = questions - correct;
            
            subjectStats[disciplineName].totalHours += hours;
            subjectStats[disciplineName].totalSessions += session.session_count || 0;
            subjectStats[disciplineName].questionsAnswered += questions;
            subjectStats[disciplineName].correctAnswers += correct;
            subjectStats[disciplineName].wrongAnswers += wrong;
          }
        });

        // Construir histórico de sessões
        const sessionHistory = sessionsData.map(session => ({
          date: session.last_session_date || session.created_at,
          duration: session.total_duration_minutes,
          type: 'timer' as const,
          subject: session.study_schedule?.discipline_name || session.study_schedule?.block_name
        }));

        // Calcular streak baseado nas datas das sessões
        const sortedSessions = sessionsData
          .filter(s => s.last_session_date)
          .sort((a, b) => new Date(b.last_session_date).getTime() - new Date(a.last_session_date).getTime());
        
        let currentStreak = 0;
        let longestStreak = 0;
        if (sortedSessions.length > 0) {
          const today = new Date();
          const lastSessionDate = new Date(sortedSessions[0].last_session_date);
          const daysDiff = Math.floor((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 1) { // Se foi hoje ou ontem
            currentStreak = 1;
            // Calcular streak completo
            for (let i = 1; i < sortedSessions.length; i++) {
              const currentDate = new Date(sortedSessions[i-1].last_session_date);
              const prevDate = new Date(sortedSessions[i].last_session_date);
              const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diff <= 1) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
          longestStreak = Math.max(currentStreak, consolidatedStats.longestStreak);
        }

        // Atualizar estatísticas consolidadas
        consolidatedStats = {
          ...consolidatedStats,
          totalHours: Math.max(consolidatedStats.totalHours, totalSessionHours),
          totalSessions: Math.max(consolidatedStats.totalSessions, totalSessionsFromSchedule),
          questionsAnswered: consolidatedStats.questionsAnswered + totalSessionQuestions,
          correctAnswers: consolidatedStats.correctAnswers + totalCorrectAnswers,
          wrongAnswers: consolidatedStats.wrongAnswers + (totalSessionQuestions - totalCorrectAnswers),
          currentStreak: Math.max(consolidatedStats.currentStreak, currentStreak),
          longestStreak: Math.max(consolidatedStats.longestStreak, longestStreak),
          lastStudyDate: sortedSessions.length > 0 ? sortedSessions[0].last_session_date : consolidatedStats.lastStudyDate,
          sessionHistory: [...consolidatedStats.sessionHistory, ...sessionHistory].slice(-100),
          subjectStats: subjectStats,
          lastUpdated: new Date().toISOString()
        };

        // Recalcular médias
        const totalDays = Object.keys(consolidatedStats.dailyStats).length || 1;
        consolidatedStats.averages = {
          dailyHours: consolidatedStats.totalHours / totalDays,
          weeklyHours: consolidatedStats.totalHours / Math.max(1, totalDays / 7),
          monthlyHours: consolidatedStats.totalHours / Math.max(1, totalDays / 30)
        };

        setStatistics(consolidatedStats);
        
        // Salvar estatísticas consolidadas
        await updateStatistics(consolidatedStats);
      } else {
        setStatistics(baseStats);
        if (!statsData?.statistics_data) {
          await createInitialStatistics();
        }
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

  const addStudySession = async (durationMinutes: number, type: 'timer' | 'manual' = 'timer', subject?: string) => {
    if (!user || durationMinutes < 20) return; // Só conta sessões > 20min

    const now = new Date();
    // Usar data local ao invés de UTC para evitar problemas de fuso horário
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
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

    // Atualizar estatísticas por disciplina
    const newSubjectStats = { ...statistics.subjectStats };
    if (subject) {
      if (!newSubjectStats[subject]) {
        newSubjectStats[subject] = {
          totalHours: 0,
          totalSessions: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          wrongAnswers: 0
        };
      }
      newSubjectStats[subject].totalHours += hours;
      newSubjectStats[subject].totalSessions += 1;
    }

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
      subjectStats: newSubjectStats,
      averages: {
        ...statistics.averages,
        dailyHours: dailyAverage
      },
      sessionHistory: [
        ...statistics.sessionHistory,
        {
          date: now.toISOString(),
          duration: durationMinutes,
          type,
          subject
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
        startDate.setDate(now.getDate() - 6); // Incluir hoje = 7 dias
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29); // Incluir hoje = 30 dias
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Garantir que sessionHistory existe e é um array
    const sessionHistory = statistics.sessionHistory || [];
    const filteredSessions = sessionHistory.filter(session => 
      session && session.date && new Date(session.date) >= startDate
    );

    const totalHours = filteredSessions.reduce((sum, session) => 
      sum + ((session.duration || 0) / 60), 0
    );

    const divisor = filter === 'day' ? 1 : filter === 'week' ? 7 : 30;

    return {
      hours: totalHours,
      sessions: filteredSessions.length,
      average: totalHours / divisor
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