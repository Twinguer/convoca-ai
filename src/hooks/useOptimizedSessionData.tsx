import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { logger } from '@/utils/logger';

interface SessionData {
  id: string;
  cycle_name: string;
  duration_minutes: number;
  questions: number;
  correct_answers: number;
  session_count: number;
  session_link?: string;
}

interface UseOptimizedSessionDataReturn {
  sessionData: Record<string, SessionData>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

interface UseOptimizedSessionDataOptions {
  dependencies?: any[];
}

/**
 * Hook otimizado para carregar dados de sessão
 * - Uma única chamada ao banco
 * - Cache inteligente
 * - Refresh manual
 */
export const useOptimizedSessionData = (options: UseOptimizedSessionDataOptions = {}): UseOptimizedSessionDataReturn => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<Record<string, SessionData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache de 30 segundos
  const CACHE_DURATION = 30 * 1000;

  const processAllSessions = useCallback((userStudyData: any): Record<string, SessionData> => {
    const allSessionData: Record<string, SessionData> = {};
    
    logger.debug('Processando todas as sessões de uma vez');
    logger.debug('Dados recebidos:', userStudyData);
    
    for (const cycle of userStudyData.study_cycles) {
      logger.debug('Processando ciclo:', cycle.cycle_name);
      
      for (const daySchedule of cycle.schedule_data.weekly_schedule) {
        logger.debug('Processando dia:', daySchedule.day);
        
        for (const session of daySchedule.sessions) {
          logger.debug('Processando sessão:', {
            id: session.id,
            discipline: session.discipline_name,
            total_stats: session.total_stats,
            hasStats: !!session.total_stats,
            duration: session.total_stats?.total_duration_minutes,
            questions: session.total_stats?.total_questions
          });
          
          allSessionData[session.id] = {
            id: session.id,
            cycle_name: cycle.cycle_name,
            duration_minutes: session.total_stats?.total_duration_minutes || 0,
            questions: session.total_stats?.total_questions || 0,
            correct_answers: session.total_stats?.total_correct || 0,
            session_count: session.total_stats?.session_count || 1,
            session_link: session.session_link
          };
        }
      }
    }
    
    logger.debug(`Processadas ${Object.keys(allSessionData).length} sessões`);
    logger.debug('Dados processados:', allSessionData);
    return allSessionData;
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setSessionData({});
      setLoading(false);
      return;
    }

    const now = Date.now();
    const isCacheValid = !forceRefresh && (now - lastFetch) < CACHE_DURATION && Object.keys(sessionData).length > 0;

    if (isCacheValid) {
      logger.debug('Usando dados em cache');
      setLoading(false);
      return;
    }

    logger.debug('Carregando dados de sessão do banco');
    setLoading(true);
    setError(null);

    try {
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      
      if (!userStudyData) {
        logger.warn('Nenhum dado do usuário encontrado');
        setSessionData({});
        return;
      }

      const processedData = processAllSessions(userStudyData);
      setSessionData(processedData);
      setLastFetch(now);
      
      logger.info(`Dados de sessão carregados: ${Object.keys(processedData).length} sessões`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Erro ao carregar dados de sessão', err);
      setError(errorMessage);
      setSessionData({});
    } finally {
      setLoading(false);
    }
  }, [user?.id, processAllSessions]);

  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Carregar dados quando o hook é montado ou quando dependências mudam
  useEffect(() => {
    loadData();
  }, [user?.id, ...(options.dependencies || [])]);

  return {
    sessionData,
    loading,
    error,
    refreshData
  };
};
