import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserStudyService } from '@/services/userStudyService';
import { StudyCycleV2 } from '@/types/userStudy';
import { createStudyCycleV2 } from '@/utils/userStudyHelpers';
import { generateId } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SessionData {
  id: string;
  start_time: string;
  end_time: string;
  discipline_name: string;
  block_name: string;
  session_link?: string;
  completed_sessions?: CompletedSession[];
  total_stats?: {
    total_duration_minutes: number;
    total_questions: number;
    total_correct: number;
    session_count: number;
    last_session_date?: string;
  };
}

export interface CompletedSession {
  date: string;
  duration_minutes: number;
  questions: number;
  correct_answers: number;
  notes?: string;
}

export interface WeeklySchedule {
  day: number;
  sessions: SessionData[];
}

export const useStudyCyclesV2 = () => {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<StudyCycleV2[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar ciclos do usuário
  const fetchCycles = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      if (userStudyData) {
        // Filtrar apenas ciclos ativos (study_cycles contém StudyCycleV2[])
        const activeCycles = userStudyData.study_cycles.filter(cycle => cycle.is_active);
        setCycles(activeCycles);
      } else {
        setCycles([]);
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
      toast.error('Erro ao carregar ciclos');
    } finally {
      setIsLoading(false);
    }
  };

  // Criar novo ciclo
  const createCycle = async (cycleData: {
    cycle_name: string;
    exam_date: string;
    organ?: string;
    position?: string;
    edital_link?: string;
    curso_link?: string;
    video_link?: string;
    blocks?: Array<{
      id: string;
      name: string;
      disciplines: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }) => {
    if (!user) return null;

    try {
      // Verificar se já existem 2 ciclos ativos
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      const activeCycles = userStudyData?.study_cycles.filter(cycle => cycle.is_active) || [];
      
      if (activeCycles.length >= 2) {
        toast.error('Você já possui 2 ciclos ativos. Desative um para criar outro.');
        return null;
      }

      // Debug: Verificar blocos recebidos
      console.log('🔍 Debug - Blocos recebidos no hook:', cycleData.blocks);
      console.log('🔍 Debug - Quantidade de blocos no hook:', cycleData.blocks?.length || 0);

      const newCycleData = createStudyCycleV2(
        cycleData.cycle_name,
        cycleData.exam_date,
        cycleData.organ,
        cycleData.position,
        cycleData.edital_link,
        cycleData.curso_link,
        cycleData.video_link,
        cycleData.blocks // Passar blocos para a função
      );

      // Debug: Verificar dados do ciclo criado
      console.log('🔍 Debug - Dados do ciclo criado:', newCycleData);
      console.log('🔍 Debug - Available blocks no ciclo:', newCycleData.schedule_data.available_blocks);

      const success = await UserStudyService.addCycle(user.id, newCycleData);
      
      if (success) {
        await fetchCycles(); // Recarregar ciclos
        toast.success('Ciclo criado com sucesso!');
        return newCycleData;
      } else {
        toast.error('Erro ao criar ciclo');
        return null;
      }
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      toast.error('Erro ao criar ciclo');
      return null;
    }
  };

  // Adicionar sessão ao cronograma
  const addScheduleSession = async (
    cycleId: string,
    dayOfWeek: number,
    sessionData: Omit<SessionData, 'id' | 'completed_sessions' | 'total_stats'>
  ) => {
    if (!user) return false;

    try {
      const newSession = {
        id: generateId(),
        ...sessionData,
        completed_sessions: [],
        total_stats: {
          total_duration_minutes: 0,
          total_questions: 0,
          total_correct: 0,
          session_count: 0
        }
      };

      // Buscar dados atuais do usuário
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      if (!userStudyData) return false;

      // Encontrar o ciclo e atualizar
      const updatedCycles = userStudyData.study_cycles.map(cycle => {
        if (cycle.id === cycleId) {
          const updatedSchedule = { ...cycle.schedule_data };
          let daySchedule = updatedSchedule.weekly_schedule.find(d => d.day === dayOfWeek);
          
          if (!daySchedule) {
            daySchedule = { day: dayOfWeek, sessions: [] };
            updatedSchedule.weekly_schedule.push(daySchedule);
          }
          
          daySchedule.sessions.push(newSession);
          updatedSchedule.metadata.total_sessions += 1;
          
          return {
            ...cycle,
            schedule_data: updatedSchedule
          };
        }
        return cycle;
      });

      // Salvar no banco
      const success = await UserStudyService.upsertUserStudyData(user.id, {
        study_cycles: updatedCycles
      });

      if (success) {
        await fetchCycles(); // Recarregar ciclos
        toast.success('Sessão adicionada ao cronograma!');
        return true;
      } else {
        toast.error('Erro ao adicionar sessão');
        return false;
      }
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Erro ao adicionar sessão');
      return false;
    }
  };

  // Registrar sessão completada
  const recordCompletedSession = async (
    cycleId: string,
    dayOfWeek: number,
    sessionId: string,
    sessionDetails: Omit<CompletedSession, 'date'>
  ) => {
    if (!user) return false;

    try {
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
        .toISOString()
        .split('T')[0];

      const completedSession: CompletedSession = {
        ...sessionDetails,
        date: localDate
      };

      // Buscar dados atuais do usuário
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      if (!userStudyData) return false;

      // Encontrar o ciclo e atualizar
      const updatedCycles = userStudyData.study_cycles.map(cycle => {
        if (cycle.id === cycleId) {
          const updatedSchedule = { ...cycle.schedule_data };
          const daySchedule = updatedSchedule.weekly_schedule.find(d => d.day === dayOfWeek);
          
          if (daySchedule) {
            const session = daySchedule.sessions.find(s => s.id === sessionId);
            if (session) {
              // Adicionar sessão completada
              if (!session.completed_sessions) {
                session.completed_sessions = [];
              }
              session.completed_sessions.push(completedSession);
              
              // Atualizar estatísticas totais
              if (!session.total_stats) {
                session.total_stats = {
                  total_duration_minutes: 0,
                  total_questions: 0,
                  total_correct: 0,
                  session_count: 0
                };
              }
              
              session.total_stats.total_duration_minutes += completedSession.duration_minutes;
              session.total_stats.total_questions += completedSession.questions;
              session.total_stats.total_correct += completedSession.correct_answers;
              session.total_stats.session_count += 1;
              session.total_stats.last_session_date = localDate;
            }
          }
          
          return {
            ...cycle,
            schedule_data: updatedSchedule
          };
        }
        return cycle;
      });

      // Debug: Verificar dados antes de salvar
      logger.debug('Dados antes de salvar sessão', { updatedCycles, completedSession });

      // Salvar no banco
      const success = await UserStudyService.upsertUserStudyData(user.id, {
        study_cycles: updatedCycles
      });

      logger.debug('Resultado do salvamento', { success });

      if (success) {
        // Atualizar estado local
        setCycles(prev => prev.map(cycle => {
          if (cycle.id === cycleId) {
            const updatedCycle = updatedCycles.find(c => c.id === cycleId);
            return updatedCycle || cycle;
          }
          return cycle;
        }));

        // Recarregar dados do banco para garantir sincronização
        await fetchCycles();

        toast.success('Sessão registrada com sucesso!');
        return true;
      } else {
        toast.error('Erro ao registrar sessão');
        return false;
      }
    } catch (error) {
      console.error('Error recording session:', error);
      toast.error('Erro ao registrar sessão');
      return false;
    }
  };

  // Remover sessão do cronograma
  const removeScheduleSession = async (
    cycleId: string,
    dayOfWeek: number,
    sessionId: string
  ) => {
    if (!user) return false;

    try {
      const cycle = cycles.find(c => c.id === cycleId);
      if (!cycle) return false;

      const updatedSchedule = { ...cycle.schedule_data };
      const daySchedule = updatedSchedule.weekly_schedule.find(d => d.day === dayOfWeek);
      
      if (daySchedule) {
        daySchedule.sessions = daySchedule.sessions.filter(s => s.id !== sessionId);
        updatedSchedule.metadata.total_sessions -= 1;
      }

      const success = await UserStudyService.updateCycle(user.id, cycleId, {
        schedule_data: updatedSchedule
      });

      if (success) {
        setCycles(prev => prev.map(c => 
          c.id === cycleId ? { ...c, schedule_data: updatedSchedule } : c
        ));
        toast.success('Sessão removida!');
        return true;
      } else {
        toast.error('Erro ao remover sessão');
        return false;
      }
    } catch (error) {
      console.error('Error removing session:', error);
      toast.error('Erro ao remover sessão');
      return false;
    }
  };

  // Atualizar ciclo
  const updateCycle = async (
    cycleId: string,
    updates: Partial<Omit<StudyCycleV2, 'id' | 'user_id' | 'schedule_data' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    try {
      const success = await UserStudyService.updateCycle(user.id, cycleId, updates);
      
      if (success) {
        await fetchCycles(); // Recarregar ciclos
        toast.success('Ciclo atualizado!');
        return true;
      } else {
        toast.error('Erro ao atualizar ciclo');
        return false;
      }
    } catch (error) {
      console.error('Error updating cycle:', error);
      toast.error('Erro ao atualizar ciclo');
      return false;
    }
  };

  // Desativar ciclo
  const deactivateCycle = async (cycleId: string) => {
    return updateCycle(cycleId, { is_active: false });
  };

  // Obter sessões para um dia específico
  const getSessionsForDay = (cycleId: string, dayOfWeek: number): SessionData[] => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return [];

    const daySchedule = cycle.schedule_data.weekly_schedule.find(d => d.day === dayOfWeek);
    return daySchedule?.sessions || [];
  };

  // Obter todas as sessões de todos os ciclos para um dia
  const getAllSessionsForDay = (dayOfWeek: number): SessionData[] => {
    return cycles.flatMap(cycle => getSessionsForDay(cycle.id, dayOfWeek));
  };

  // Remover ciclo
  const removeCycle = async (cycleId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await UserStudyService.removeCycle(user.id, cycleId);
      
      if (success) {
        await fetchCycles(); // Recarregar ciclos
        toast.success('Ciclo removido com sucesso!');
        return true;
      } else {
        toast.error('Erro ao remover ciclo');
        return false;
      }
    } catch (error) {
      console.error('Error removing cycle:', error);
      toast.error('Erro ao remover ciclo');
      return false;
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [user?.id]);

  return {
    cycles,
    isLoading,
    fetchCycles,
    createCycle,
    addScheduleSession,
    recordCompletedSession,
    removeScheduleSession,
    updateCycle,
    deactivateCycle,
    removeCycle,
    getSessionsForDay,
    getAllSessionsForDay
  };
};
