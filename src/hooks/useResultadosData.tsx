
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

export function useResultadosData(concursoId?: string) {
  const { id: urlId } = useParams() as { id: string };
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Usar concursoId passado como prop ou do URL
  const id = concursoId || urlId;
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
    staleTime: 10000, // 10 segundos
    enabled: !!id, // Só executar se tiver um ID válido
  });
  
  // Fetch creator information if available
  const { data: creatorInfo, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['creator', concurso?.created_by_user_id],
    queryFn: async () => {
      if (!concurso?.created_by_user_id) return null;
      
      const { data, error } = await supabase
        .from('public_profiles')
        .select('name')
        .eq('id', concurso.created_by_user_id)
        .single();
        
      if (error) {
        logger.error('Error fetching creator info', 'USE_RESULTADOS_DATA', error);
        return null;
      }
      
      return data;
    },
    enabled: !!concurso?.created_by_user_id,
    staleTime: 300000, // 5 minutos
  });
  
  // Configuração para rankings (query simples) - DESABILITADO para usar paginação
  const { 
    data: rankings = [], 
    isLoading: isLoadingRankings, 
    refetch: refetchRankings,
    isRefetching
  } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // Aumentado para 10 minutos
    enabled: false, // DESABILITADO - usar useRankingsPagination
  });
  
  // Fetch participant count - for all users (authenticated or not)
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    staleTime: 30000, // Aumentado para 30 segundos para reduzir atualizações
  });
  
  // Verificar se o usuário já está participando deste concurso
  const { data: userParticipationStatus, isLoading: isCheckingParticipation } = useQuery({
    queryKey: ['user-participation', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return { isParticipating: false };
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('concurso_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) {
        logger.error('Error checking participation', 'USE_RESULTADOS_DATA', error);
        return { isParticipating: false };
      }
      
      return { 
        isParticipating: !!data,
        rankingId: data?.id 
      };
    },
    enabled: !!user && !!id,
    staleTime: 10000,
  });
  
  // Efeito para configurar um canal de escuta para atualizações em tempo real da tabela user_rankings
  // DESABILITADO TEMPORARIAMENTE para melhorar performance e evitar travamentos
  // useEffect(() => {
  //   if (!id) return;

  //   // Configura um canal para escutar atualizações na tabela user_rankings
  //   const channel = supabase
  //     .channel('rankings-updates')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
  //         schema: 'public',
  //         table: 'user_rankings',
  //         filter: `concurso_id=eq.${id}`
  //       },
  //       (payload) => {
  //         console.log('[useResultadosData] Detected change in user_rankings:', payload);
  //         // Força atualização dos rankings quando houver mudanças
  //         refetchRankings();
  //         refetchCount();
  //       }
  //     )
  //     .subscribe();

  //   // Cleanup: remover inscrição quando o componente for desmontado
  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [id, refetchRankings, refetchCount]);
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingCount || isLoadingCreator || isCheckingParticipation;
  
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
      logger.info('Usuário não autenticado, atualizando apenas os dados locais', 'USE_RESULTADOS_DATA');
      await refetchRankings();
      await refetchCount();
      
      return {
        success: true,
        message: "Dados atualizados localmente"
      };
    }
      
    // Recalcular pontuações para todos os usuários apenas se autenticado
    try {
      logger.info('Chamando recalculateAllUserScores para concurso', 'USE_RESULTADOS_DATA', { concursoId: id });
      const result = await recalculateAllUserScores(id);
      
      if (!result.success) {
        logger.error('Erro ao recalcular pontuações', 'USE_RESULTADOS_DATA', result.error);
        return { success: false, error: result.error };
      } else {
        logger.info('Pontuações recalculadas com sucesso', 'USE_RESULTADOS_DATA', result);
        
        // Força imediatamente uma atualização dos dados
        await refetchRankings();
        await refetchCount();
        
        return { success: true, updatedCount: result.updatedCount };
      }
    } catch (err) {
      logger.error('Erro inesperado ao recalcular pontuações', 'USE_RESULTADOS_DATA', err);
      return { success: false, error: String(err) };
    }
  };
  
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
    inscritos: concurso?.inscritos || 0,
    // Adiciona informação sobre participação do usuário
    isParticipating: userParticipationStatus?.isParticipating || false,
    userRankingId: userParticipationStatus?.rankingId
  };
}
