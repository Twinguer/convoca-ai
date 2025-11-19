import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserStudyService } from '@/services/userStudyService';
import { StudySession, SessionProgress } from '@/types/userStudy';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
import { 
  createStudySessionFromProgress, 
  updateSessionWithProgress,
  getTodayString 
} from '@/utils/userStudyHelpers';

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
      const sessionsData = await UserStudyService.getSessions(user.id);
      setSessions(sessionsData);
    } catch (error) {
      devLog.error('Error fetching study sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionByScheduleId = async (scheduleSessionId: string): Promise<StudySession | null> => {
    if (!user) return null;
    return await UserStudyService.getSessionByScheduleId(user.id, scheduleSessionId);
  };

  const createOrUpdateSession = async (
    scheduleSessionId: string, 
    progress: SessionProgress, 
    sessionLink?: string
  ) => {
    if (!user) return;

    try {
      const existingSession = await getSessionByScheduleId(scheduleSessionId);

      if (existingSession) {
        // Atualizar sessão existente (acumular dados)
        const updatedSession = updateSessionWithProgress(existingSession, progress);
        
        if (sessionLink) {
          updatedSession.session_link = sessionLink;
        }

        const success = await UserStudyService.updateSession(user.id, existingSession.id, updatedSession);
        
        if (!success) {
          toast({
            title: "Erro",
            description: "Erro ao atualizar sessão de estudo",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Criar nova sessão
        const newSessionData = createStudySessionFromProgress(progress, scheduleSessionId, sessionLink);
        const success = await UserStudyService.addSession(user.id, newSessionData);
        
        if (!success) {
          toast({
            title: "Erro",
            description: "Erro ao criar sessão de estudo",
            variant: "destructive"
          });
          return;
        }
      }

      // Atualizar estado local
      await fetchSessions();

      toast({
        title: "Sucesso",
        description: "Sessão de estudo registrada com sucesso",
        variant: "default"
      });

    } catch (error) {
      devLog.error('Error creating/updating study session:', error);
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
      const existingSession = await getSessionByScheduleId(scheduleSessionId);
      
      if (existingSession) {
        const success = await UserStudyService.updateSession(user.id, existingSession.id, {
          session_link: sessionLink
        });

        if (success) {
          // Atualizar estado local
          await fetchSessions();
        }
      }
    } catch (error) {
      devLog.error('Error updating session link:', error);
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