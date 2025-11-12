import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';

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
  targetUserId?: string; // ✅ NOVO: userId opcional para permitir uso no modo coach
}

/**
 * Hook otimizado para carregar dados de sessão
 * - Uma única chamada ao banco
 * - Cache inteligente
 * - Refresh manual
 */
export const useOptimizedSessionData = (options: UseOptimizedSessionDataOptions = {}): UseOptimizedSessionDataReturn => {
  const { user } = useAuth();
  const { targetUserId, dependencies = [] } = options;
  const [sessionData, setSessionData] = useState<Record<string, SessionData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache de 30 segundos
  const CACHE_DURATION = 30 * 1000;

  const processAllSessions = useCallback((userStudyData: any): Record<string, SessionData> => {
    const allSessionData: Record<string, SessionData> = {};
    
    // ✅ Prioridade 1: Buscar de study_schedule (estrutura nova)
    if (userStudyData.study_schedule && Array.isArray(userStudyData.study_schedule)) {
      
      for (const session of userStudyData.study_schedule) {
        // Buscar ciclo (incluindo inativos para garantir que o nome apareça)
        const cycle = userStudyData.study_cycles?.find((c: any) => c.id === session.cycle_id);
        
        // Sempre criar entrada, mesmo sem ciclo (para exibir dados parciais)
        allSessionData[session.id] = {
          id: session.id,
          cycle_name: cycle?.cycle_name || 'Ciclo desconhecido',
          duration_minutes: session.total_stats?.total_duration_minutes || 0,
          questions: session.total_stats?.total_questions || 0,
          correct_answers: session.total_stats?.total_correct || 0,
          session_count: session.total_stats?.session_count || 1,
          session_link: session.session_link
        };
      }
    }
    
    // ✅ Fallback: Buscar de weekly_schedule (estrutura antiga)
    if (Object.keys(allSessionData).length === 0) {
      
      for (const cycle of userStudyData.study_cycles) {
        if (cycle.schedule_data?.weekly_schedule) {
          for (const daySchedule of cycle.schedule_data.weekly_schedule) {
            for (const session of daySchedule.sessions) {
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
      }
    }
    
    // Debug logs removed for security
    return allSessionData;
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    const userId = targetUserId || user?.id;
    if (!userId) {
      setSessionData({});
      setLoading(false);
      return;
    }

    const now = Date.now();
    const isCacheValid = !forceRefresh && (now - lastFetch) < CACHE_DURATION && Object.keys(sessionData).length > 0;

    if (isCacheValid) {
      console.log('📦 Usando dados em cache');
      setLoading(false);
      return;
    }

    // Debug logs removed for security
    setLoading(true);
    setError(null);

    try {
      const userStudyData = await UserStudyService.getUserStudyData(userId);
      
      if (!userStudyData) {
        console.warn('⚠️ Nenhum dado do usuário encontrado');
        setSessionData({});
        return;
      }

      const processedData = processAllSessions(userStudyData);
      setSessionData(processedData);
      setLastFetch(now);
      
      // Debug logs removed for security
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao carregar dados de sessão', err);
      setError(errorMessage);
      setSessionData({});
    } finally {
      setLoading(false);
    }
  }, [user?.id, targetUserId, processAllSessions]);

  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Carregar dados quando o hook é montado ou quando dependências mudam
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    sessionData,
    loading,
    error,
    refreshData
  };
};
