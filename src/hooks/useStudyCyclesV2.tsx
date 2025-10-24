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

  // Adicionar sessão ao cronograma (agora salva em study_schedule)
  const addScheduleSession = async (
    cycleId: string,
    dayOfWeek: number,
    sessionData: Omit<SessionData, 'id' | 'completed_sessions' | 'total_stats'>
  ) => {
    if (!user) return false;

    try {
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      if (!userStudyData) return false;

      // ✅ Criar nova sessão com cycle_id
      const newSession = {
        id: generateId(),
        cycle_id: cycleId,
        day_of_week: dayOfWeek,
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        discipline_name: sessionData.discipline_name,
        block_name: sessionData.block_name,
        session_link: sessionData.session_link,
        total_stats: {
          session_count: 0,
          total_duration_minutes: 0,
          total_questions: 0,
          total_correct: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // ✅ Adicionar a study_schedule
      const updatedSchedule = [...(userStudyData.study_schedule || []), newSession];

      // Atualizar metadata do ciclo
      const updatedCycles = userStudyData.study_cycles.map(cycle => {
        if (cycle.id === cycleId) {
          return {
            ...cycle,
            schedule_data: {
              ...cycle.schedule_data,
              metadata: {
                ...cycle.schedule_data.metadata,
                total_sessions: (cycle.schedule_data.metadata.total_sessions || 0) + 1
              }
            }
          };
        }
        return cycle;
      });

      const success = await UserStudyService.upsertUserStudyData(user.id, {
        study_schedule: updatedSchedule,
        study_cycles: updatedCycles
      });

      if (success) {
        await fetchCycles();
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

  // Registrar sessão completada (agora salva em study_sessions separado)
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

      // Encontrar informações da sessão no ciclo
      const cycle = userStudyData.study_cycles.find(c => c.id === cycleId);
      if (!cycle) return false;

      const daySchedule = cycle.schedule_data.weekly_schedule.find(d => d.day === dayOfWeek);
      const session = daySchedule?.sessions.find(s => s.id === sessionId);
      if (!session) return false;

      // Salvar sessão completada em study_sessions usando função RPC
      const { error: sessionError } = await supabase.rpc('add_completed_study_session', {
        user_uuid: user.id,
        session_data: {
          session_date: localDate,
          duration_minutes: completedSession.duration_minutes,
          total_questions: completedSession.questions,
          total_correct_answers: completedSession.correct_answers,
          notes: completedSession.notes,
          discipline_name: session.discipline_name,
          block_name: session.block_name,
          schedule_session_id: sessionId,
          cycle_id: cycleId,
          study_type: 'timer'
        }
      });

      if (sessionError) {
        console.error('Error saving completed session:', sessionError);
        toast.error('Erro ao registrar sessão');
        return false;
      }

      // Atualizar total_stats no ciclo (para exibição no cronograma)
      const updatedCycles = userStudyData.study_cycles.map(c => {
        if (c.id === cycleId) {
          const updatedSchedule = { ...c.schedule_data };
          const day = updatedSchedule.weekly_schedule.find(d => d.day === dayOfWeek);
          
          if (day) {
            const sess = day.sessions.find(s => s.id === sessionId);
            if (sess) {
              if (!sess.total_stats) {
                sess.total_stats = {
                  total_duration_minutes: 0,
                  total_questions: 0,
                  total_correct: 0,
                  session_count: 0
                };
              }
              
              sess.total_stats.total_duration_minutes += completedSession.duration_minutes;
              sess.total_stats.total_questions += completedSession.questions;
              sess.total_stats.total_correct += completedSession.correct_answers;
              sess.total_stats.session_count += 1;
              sess.total_stats.last_session_date = localDate;
            }
          }
          
          return { ...c, schedule_data: updatedSchedule };
        }
        return c;
      });

      // Atualizar apenas total_stats nos ciclos
      const success = await UserStudyService.upsertUserStudyData(user.id, {
        study_cycles: updatedCycles
      });

      if (success) {
        await fetchCycles();
        toast.success('Sessão registrada com sucesso!');
        return true;
      } else {
        toast.error('Erro ao atualizar estatísticas');
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

  // Obter sessões para um dia específico (compatível com ambas estruturas)
  const getSessionsForDay = async (cycleId: string, dayOfWeek: number): Promise<SessionData[]> => {
    try {
      const userStudyData = await UserStudyService.getUserStudyData(user!.id);
      if (!userStudyData) return [];

      // Buscar de study_schedule primeiro
      const scheduleSessions = (userStudyData.study_schedule || [])
        .filter(s => s.cycle_id === cycleId && s.day_of_week === dayOfWeek)
        .map(s => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          discipline_name: s.discipline_name || '',
          block_name: s.block_name || '',
          session_link: s.session_link,
          total_stats: s.total_stats,
          completed_sessions: []
        }));

      if (scheduleSessions.length > 0) return scheduleSessions;

      // Fallback: buscar de weekly_schedule (legado)
      const cycle = cycles.find(c => c.id === cycleId);
      if (!cycle) return [];

      const daySchedule = cycle.schedule_data.weekly_schedule?.find(d => d.day === dayOfWeek);
      return daySchedule?.sessions || [];
    } catch (error) {
      console.error('Error getting sessions for day:', error);
      return [];
    }
  };

  // Obter todas as sessões de todos os ciclos para um dia
  const getAllSessionsForDay = async (dayOfWeek: number): Promise<SessionData[]> => {
    try {
      const allSessions: SessionData[] = [];
      for (const cycle of cycles) {
        const sessions = await getSessionsForDay(cycle.id, dayOfWeek);
        allSessions.push(...sessions);
      }
      return allSessions;
    } catch (error) {
      console.error('Error getting all sessions for day:', error);
      return [];
    }
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
