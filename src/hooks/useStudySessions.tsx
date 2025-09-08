import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StudySession {
  id: string;
  schedule_session_id: string;
  session_link?: string;
  total_duration_minutes: number;
  total_questions: number;
  total_correct_answers: number;
  session_count: number;
  last_session_date: string;
  created_at: string;
  updated_at: string;
}

interface SessionProgress {
  duration: number;
  questions: number;
  correctAnswers: number;
  notes?: string;
}

export const useStudySessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching study sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching study sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionByScheduleId = (scheduleSessionId: string): StudySession | null => {
    return sessions.find(session => session.schedule_session_id === scheduleSessionId) || null;
  };

  const createOrUpdateSession = async (
    scheduleSessionId: string, 
    progress: SessionProgress, 
    sessionLink?: string
  ) => {
    if (!user) return;

    try {
      const existingSession = getSessionByScheduleId(scheduleSessionId);
      // Usar data local ao invés de UTC para evitar problemas de fuso horário
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      if (existingSession) {
        // Atualizar sessão existente (acumular dados)
        const updatedData = {
          total_duration_minutes: existingSession.total_duration_minutes + progress.duration,
          total_questions: existingSession.total_questions + progress.questions,
          total_correct_answers: existingSession.total_correct_answers + progress.correctAnswers,
          session_count: existingSession.session_count + 1,
          last_session_date: localDate,
          updated_at: new Date().toISOString(),
          ...(sessionLink && { session_link: sessionLink })
        };

        const { error } = await supabase
          .from('study_sessions')
          .update(updatedData)
          .eq('id', existingSession.id);

        if (error) {
          console.error('Error updating study session:', error);
          toast({
            title: "Erro",
            description: "Erro ao atualizar sessão de estudo",
            variant: "destructive"
          });
          return;
        }

        // Atualizar estado local
        setSessions(prev => prev.map(session => 
          session.id === existingSession.id 
            ? { ...session, ...updatedData }
            : session
        ));
      } else {
        // Criar nova sessão
        const newSession = {
          user_id: user.id,
          schedule_session_id: scheduleSessionId,
          session_link: sessionLink,
          total_duration_minutes: progress.duration,
          total_questions: progress.questions,
          total_correct_answers: progress.correctAnswers,
          session_count: 1,
          last_session_date: localDate,
          session_date: localDate,
          start_time: new Date().toISOString(),
          duration_minutes: progress.duration,
          notes: progress.notes,
          study_type: 'mixed'
        };

        const { data, error } = await supabase
          .from('study_sessions')
          .insert(newSession)
          .select()
          .single();

        if (error) {
          console.error('Error creating study session:', error);
          toast({
            title: "Erro",
            description: "Erro ao criar sessão de estudo",
            variant: "destructive"
          });
          return;
        }

        setSessions(prev => [data, ...prev]);
      }

      toast({
        title: "Sucesso",
        description: "Sessão de estudo registrada com sucesso",
        variant: "default"
      });

    } catch (error) {
      console.error('Error creating/updating study session:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar sessão de estudo",
        variant: "destructive"
      });
    }
  };

  const updateSessionLink = async (scheduleSessionId: string, sessionLink: string) => {
    if (!user) return;

    try {
      const existingSession = getSessionByScheduleId(scheduleSessionId);
      
      if (existingSession) {
        const { error } = await supabase
          .from('study_sessions')
          .update({ session_link: sessionLink })
          .eq('id', existingSession.id);

        if (error) {
          console.error('Error updating session link:', error);
          return;
        }

        setSessions(prev => prev.map(session => 
          session.id === existingSession.id 
            ? { ...session, session_link: sessionLink }
            : session
        ));
      }
    } catch (error) {
      console.error('Error updating session link:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.id]);

  return {
    sessions,
    isLoading,
    getSessionByScheduleId,
    createOrUpdateSession,
    updateSessionLink,
    refreshSessions: fetchSessions
  };
};