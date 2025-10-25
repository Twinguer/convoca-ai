import { useState, useEffect } from 'react';
import { SessionManager } from '@/services/sessionManager';
import { supabase } from '@/integrations/supabase/client';

interface RankingData {
  titulo: string;
  orgao: string;
  banca: string;
  exam_type: string;
  disciplines: any[];
  status: string;
  exam_date: string;
  estados: string[];
  cargos: string[];
  minimum_total_score: number | null;
  minimum_total_score_cotas: number | null;
  booklets: any[];
}

interface UserParticipation {
  answers: Record<number, string>;
  booklet_id: string;
  score_prova_objetiva: number | null;
  score_prova_discursiva: number | null;
  score_total: number | null;
  subject_scores: Record<string, number>;
}

interface UseSecureRankingReturn {
  rankingData: RankingData | null;
  userParticipation: UserParticipation | null;
  sessionToken: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSecureRanking = (
  concursoId: string, 
  action: 'view' | 'participate' | 'edit'
): UseSecureRankingReturn => {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [userParticipation, setUserParticipation] = useState<UserParticipation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Criar sessão apropriada
      let token: string | null = null;

      switch (action) {
        case 'view':
          token = await SessionManager.createViewSession(concursoId);
          break;
        case 'participate':
          token = await SessionManager.createParticipateSession(concursoId);
          break;
        case 'edit':
          token = await SessionManager.createEditSession(concursoId);
          break;
      }

      if (!token) {
        setError('Falha ao criar sessão');
        return;
      }

      setSessionToken(token);

      // Buscar dados do ranking usando a sessão
      const { data, error: fetchError } = await supabase.functions.invoke(
        'get-ranking-data',
        {
          body: { session_token: token }
        }
      );

      if (fetchError || !data?.ranking) {
        setError('Falha ao carregar dados do ranking');
        return;
      }

      setRankingData(data.ranking);
      setUserParticipation(data.user_participation || null);
    } catch (err) {
      console.error('[useSecureRanking] Error:', err);
      setError('Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (concursoId) {
      fetchData();
    }

    return () => {
      SessionManager.clearSession();
    };
  }, [concursoId, action]);

  return {
    rankingData,
    userParticipation,
    sessionToken,
    isLoading,
    error,
    refetch: fetchData
  };
};
