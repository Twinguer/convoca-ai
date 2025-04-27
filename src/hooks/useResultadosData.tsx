
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
    staleTime: 60000, // 1 minuto
  });
  
  // Fetch creator information if available
  const { data: creatorInfo, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['creator', concurso?.created_by_user_id],
    queryFn: async () => {
      if (!concurso?.created_by_user_id) return null;
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name, status_concurseiro')
        .eq('id', concurso.created_by_user_id)
        .single();
        
      if (error) {
        console.error('Error fetching creator info:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!concurso?.created_by_user_id,
    staleTime: 300000, // 5 minutos
  });
  
  // Fetch rankings with more frequent refetching - only if user is authenticated
  const { data: rankings = [], isLoading: isLoadingRankings, refetch: refetchRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => isAuthenticated ? fetchUserRankings(id) : Promise.resolve([]),
    refetchInterval: 3000, // Reduzido para 3 segundos
    refetchOnWindowFocus: true,
    staleTime: 1000, // Considerado stale após 1 segundo para garantir atualizações frequentes
    enabled: isAuthenticated,
  });
  
  // Fetch participant count - for all users (authenticated or not)
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });
  
  // Check if any rankings need recalculation
  const { data: recalculationNeeded } = useQuery({
    queryKey: ['recalculation-check', id],
    queryFn: async () => {
      try {
        if (!id) return false;
        
        // Check if any rankings for this concurso need recalculation
        const { data, error } = await supabase
          .from('user_rankings')
          .select('count')
          .eq('concurso_id', id)
          .eq('is_score_recalculated', false)
          .count();
        
        if (error) {
          console.error('Error checking recalculation status:', error);
          return false;
        }
        
        // If count > 0, recalculation is needed
        return data && data.count > 0;
      } catch (err) {
        console.error('Error in recalculation check:', err);
        return false;
      }
    },
    refetchInterval: 10000, // Check every 10 seconds
    enabled: !!id,
  });
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || (isAuthenticated && isLoadingRankings) || isLoadingCount || isLoadingCreator;
  
  // Function to manually refresh all data
  const refreshData = async () => {
    console.log("[useResultadosData] Atualizando rankings manualmente");
    
    if (recalculationNeeded && id) {
      try {
        // Trigger recalculation of all scores
        console.log("[useResultadosData] Detectado necessidade de recálculo de pontuações");
        const result = await recalculateAllUserScores(id);
        console.log("[useResultadosData] Resultado do recálculo:", result);
      } catch (error) {
        console.error("[useResultadosData] Erro ao recalcular pontuações:", error);
      }
    }
    
    if (isAuthenticated) {
      refetchRankings();
    }
    refetchCount();
  };
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    user,
    refreshData,
    creatorName: creatorInfo?.name || (concurso?.is_admin_created ? 'Administrador' : 'Usuário'),
    userStatus: creatorInfo?.status_concurseiro,
    inscritos: concurso?.inscritos || 0,
    needsRecalculation: recalculationNeeded
  };
}
