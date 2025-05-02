
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
        .select('name')
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
  
  // Fetch rankings mais frequentemente para todos os usuários
  const { data: rankings = [], isLoading: isLoadingRankings, refetch: refetchRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchInterval: 10000, // Reduzido para 10 segundos para atualizar mais frequentemente
    refetchOnWindowFocus: true,
    staleTime: 2000, // Reduzido para 2 segundos - dados considerados "stale" mais rapidamente
    enabled: !!id, // Só depende do ID estar disponível, não mais da autenticação
  });
  
  // Fetch participant count - for all users (authenticated or not)
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    refetchInterval: 10000, // Reduzido para 10 segundos também
    refetchOnWindowFocus: true,
    staleTime: 2000, // 2 segundos
  });
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingCount || isLoadingCreator;
  
  // Function to manually refresh all data
  const refreshData = async () => {
    console.log("[useResultadosData] Atualizando rankings manualmente");
    
    if (!id) {
      console.error("[useResultadosData] ID do concurso não fornecido");
      return;
    }
      
    // Recalcular pontuações para todos os usuários independentemente do status de autenticação
    try {
      console.log("[useResultadosData] Chamando recalculateAllUserScores para concurso:", id);
      const result = await recalculateAllUserScores(id);
      
      if (!result.success) {
        console.error("[useResultadosData] Erro ao recalcular pontuações:", result.error);
      } else {
        console.log("[useResultadosData] Pontuações recalculadas com sucesso:", result);
      }
    } catch (err) {
      console.error("[useResultadosData] Erro inesperado ao recalcular pontuações:", err);
    }
    
    // Refetch dos dados atualizados
    console.log("[useResultadosData] Recarregando dados de rankings");
    await refetchRankings();
    
    console.log("[useResultadosData] Recarregando contagem de participantes");
    await refetchCount();
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
    inscritos: concurso?.inscritos || 0
  };
}
