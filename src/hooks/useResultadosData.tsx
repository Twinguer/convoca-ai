
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { useEffect } from 'react';

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
    staleTime: 10000, // 10 segundos
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
  
  // Configuração para rankings, sem atualização automática frequente
  const { 
    data: rankings = [], 
    isLoading: isLoadingRankings, 
    refetch: refetchRankings,
    isRefetching
  } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchOnWindowFocus: true,
    staleTime: 30000, // Aumentado para 30 segundos para reduzir atualizações
    enabled: !!id,
  });
  
  // Fetch participant count - for all users (authenticated or not)
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    staleTime: 30000, // Aumentado para 30 segundos para reduzir atualizações
  });
  
  // Efeito para configurar um canal de escuta para atualizações em tempo real da tabela user_rankings
  useEffect(() => {
    if (!id) return;

    // Configura um canal para escutar atualizações na tabela user_rankings
    const channel = supabase
      .channel('rankings-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_rankings',
          filter: `concurso_id=eq.${id}`
        },
        (payload) => {
          console.log('[useResultadosData] Detected change in user_rankings:', payload);
          // Força atualização dos rankings quando houver mudanças
          refetchRankings();
          refetchCount();
        }
      )
      .subscribe();

    // Cleanup: remover inscrição quando o componente for desmontado
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetchRankings, refetchCount]);
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingCount || isLoadingCreator;
  
  // Function to manually refresh all data
  const refreshData = async () => {
    console.log("[useResultadosData] Atualizando rankings manualmente");
    
    if (!id) {
      console.error("[useResultadosData] ID do concurso não fornecido");
      return {
        success: false,
        error: "ID do concurso não fornecido"
      };
    }

    // Verifica se o usuário está autenticado
    if (!isAuthenticated) {
      console.log("[useResultadosData] Usuário não autenticado, atualizando apenas os dados locais");
      await refetchRankings();
      await refetchCount();
      
      return {
        success: true,
        message: "Dados atualizados localmente"
      };
    }
      
    // Recalcular pontuações para todos os usuários apenas se autenticado
    try {
      console.log("[useResultadosData] Chamando recalculateAllUserScores para concurso:", id);
      const result = await recalculateAllUserScores(id);
      
      if (!result.success) {
        console.error("[useResultadosData] Erro ao recalcular pontuações:", result.error);
        return { success: false, error: result.error };
      } else {
        console.log("[useResultadosData] Pontuações recalculadas com sucesso:", result);
        
        // Força imediatamente uma atualização dos dados
        await refetchRankings();
        await refetchCount();
        
        return { success: true, updatedCount: result.updatedCount };
      }
    } catch (err) {
      console.error("[useResultadosData] Erro inesperado ao recalcular pontuações:", err);
      return { success: false, error: String(err) };
    }
  };
  
  // Remover auto-refresh ao montar o componente
  // Agora o usuário precisa clicar no botão de atualizar explicitamente
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    isRefetching,
    user,
    refreshData,
    creatorName: creatorInfo?.name || (concurso?.is_admin_created ? 'Administrador' : 'Usuário'),
    inscritos: concurso?.inscritos || 0
  };
}
