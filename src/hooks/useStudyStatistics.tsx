import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyStatistics, defaultUserStudy } from '@/types/userStudy';
import { calculateStudyStatistics } from '@/utils/userStudyHelpers';

// Mutex global para evitar operações simultâneas
let globalUpdateInProgress = false;

export const useStudyStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<StudyStatistics>(defaultUserStudy.study_statistics as StudyStatistics);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadStatistics = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Buscar dados consolidados do user_study_v2
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      
      if (userStudyData) {
        // SEMPRE recalcular estatísticas com base nas sessões atuais
        // Isso garante que os dados estejam sempre corretos e atualizados
        if (userStudyData.study_sessions && userStudyData.study_sessions.length > 0) {
          const calculatedStats = calculateStudyStatistics(userStudyData.study_sessions);
          setStatistics(calculatedStats);
          
          // Salvar estatísticas recalculadas no banco em background
          // (não bloqueia a UI)
          UserStudyService.updateStatistics(user.id, calculatedStats).catch(err => {
            console.error('Error updating statistics in background:', err);
          });
        } else {
          // Sem sessões, usar estatísticas vazias
          setStatistics(defaultUserStudy.study_statistics as StudyStatistics);
        }
      } else {
        // Inicializar dados do usuário
        await UserStudyService.initializeUserStudyData(user.id);
        setStatistics(defaultUserStudy.study_statistics as StudyStatistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStatisticsToDatabase = async (stats: StudyStatistics) => {
    if (!user) return;
    await UserStudyService.updateStatistics(user.id, stats);
  };

  const createInitialStatistics = async () => {
    if (!user) return;
    await UserStudyService.initializeUserStudyData(user.id);
  };

  const updateStatistics = async (newStats: Partial<StudyStatistics>) => {
    if (!user) return;

    // Atualizar estado local imediatamente
    const updatedStats = { ...statistics, ...newStats };
    setStatistics(updatedStats);

    // Cancelar timeout anterior se existir
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce: aguardar 500ms antes de salvar no banco
    updateTimeoutRef.current = setTimeout(async () => {
      await performDatabaseUpdate(updatedStats);
    }, 500);
  };

  const performDatabaseUpdate = async (updatedStats: StudyStatistics) => {
    if (!user) return;

    // Mutex global para evitar operações simultâneas de qualquer instância
    if (globalUpdateInProgress) {
      return;
    }

    // Prevenir múltiplas chamadas simultâneas da mesma instância
    if (isUpdating) {
      return;
    }

    globalUpdateInProgress = true;
    setIsUpdating(true);

    try {
      await UserStudyService.updateStatistics(user.id, updatedStats);
    } catch (error) {
      console.error('Error updating statistics:', error);
    } finally {
      globalUpdateInProgress = false;
      setIsUpdating(false);
    }
  };

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
      await UserStudyService.deleteUserStudyData(user.id);
      await UserStudyService.initializeUserStudyData(user.id);
      setStatistics(defaultUserStudy.study_statistics as StudyStatistics);
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