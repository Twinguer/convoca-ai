import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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

export interface StudyCycleV2 {
  id: string;
  user_id: string;
  cycle_name: string;
  exam_date: string;
  organ?: string;
  position?: string;
  edital_link?: string;
  curso_link?: string;
  video_link?: string;
  is_active: boolean;
  schedule_data: {
    weekly_schedule: WeeklySchedule[];
    metadata: {
      total_sessions: number;
      total_hours: number;
    };
  };
  created_at: string;
  updated_at: string;
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
      const { data, error } = await supabase
        .from('study_cycles_v2')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCycles(data || []);
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
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('study_cycles_v2')
        .insert({
          user_id: user.id,
          ...cycleData,
          schedule_data: {
            weekly_schedule: [],
            metadata: {
              total_sessions: 0,
              total_hours: 0
            }
          }
        })
        .select()
        .single();

      if (error) throw error;

      setCycles(prev => [data, ...prev]);
      toast.success('Ciclo criado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      if (error.message?.includes('2 ciclos ativos')) {
        toast.error('Você já possui 2 ciclos ativos. Desative um para criar outro.');
      } else {
        toast.error('Erro ao criar ciclo');
      }
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
        id: uuidv4(),
        ...sessionData,
        completed_sessions: [],
        total_stats: {
          total_duration_minutes: 0,
          total_questions: 0,
          total_correct: 0,
          session_count: 0
        }
      };

      const { data, error } = await supabase.rpc('add_schedule_session', {
        p_cycle_id: cycleId,
        p_day_of_week: dayOfWeek,
        p_session_data: newSession
      });

      if (error) throw error;

      // Atualizar estado local
      setCycles(prev => prev.map(cycle => {
        if (cycle.id === cycleId) {
          return {
            ...cycle,
            schedule_data: data
          };
        }
        return cycle;
      }));

      toast.success('Sessão adicionada ao cronograma!');
      return true;
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

      const { data, error } = await supabase.rpc('record_completed_session', {
        p_cycle_id: cycleId,
        p_day_of_week: dayOfWeek,
        p_session_id: sessionId,
        p_session_details: completedSession
      });

      if (error) throw error;

      // Atualizar estado local
      setCycles(prev => prev.map(cycle => {
        if (cycle.id === cycleId) {
          return {
            ...cycle,
            schedule_data: data
          };
        }
        return cycle;
      }));

      toast.success('Sessão registrada com sucesso!');
      return true;
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

      const { error } = await supabase
        .from('study_cycles_v2')
        .update({ schedule_data: updatedSchedule })
        .eq('id', cycleId);

      if (error) throw error;

      setCycles(prev => prev.map(c => 
        c.id === cycleId ? { ...c, schedule_data: updatedSchedule } : c
      ));

      toast.success('Sessão removida!');
      return true;
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
      const { error } = await supabase
        .from('study_cycles_v2')
        .update(updates)
        .eq('id', cycleId);

      if (error) throw error;

      setCycles(prev => prev.map(c => 
        c.id === cycleId ? { ...c, ...updates } : c
      ));

      toast.success('Ciclo atualizado!');
      return true;
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
    getSessionsForDay,
    getAllSessionsForDay
  };
};
