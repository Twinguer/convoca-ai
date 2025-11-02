// @ts-nocheck
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { rankingCache } from '@/services/rankingCache';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import { recalculateUserScore } from '@/integrations/supabase/rankings/rankingMutations';

export function useResultadosData(concursoId?: string) {
  const { id: urlId } = useParams() as { id: string };
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  
  // Usar concursoId passado como prop ou do URL
  const id = concursoId || urlId;
  
  // Estados para controle de recálculo
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationProgress, setRecalculationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  
  // Debug logs removed for security
  
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
    // // Debug logs removed for security
    // // Debug logs removed for security
    // // Debug logs removed for security
    // // Debug logs removed for security
      
      if (!concurso?.created_by_user_id) {
        // // Debug logs removed for security
        return null;
      }
      
      // // Debug logs removed for security
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name')
        .eq('id', concurso.created_by_user_id)
        .single();
        
      // // Debug logs removed for security
        
      if (error) {
        // // Debug logs removed for security
        logger.error('Error fetching creator info', 'USE_RESULTADOS_DATA', error);
        return null;
      }
      
      // // Debug logs removed for security
      return data;
    },
    enabled: !!concurso?.created_by_user_id && !!concurso,
    staleTime: 300000, // 5 minutos
  });
  
  // Configuração para rankings (query simples) - HABILITADO para exibir classificação
  const { 
    data: rankings = [], 
    isLoading: isLoadingRankings, 
    refetch: refetchRankings,
    isRefetching
  } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchOnWindowFocus: false,
    staleTime: 0, // Sempre buscar dados frescos para garantir atualizações imediatas
    refetchInterval: 30000, // Refetch automático a cada 30 segundos para garantir atualizações
    enabled: !!id, // HABILITADO - buscar rankings para exibir classificação
  });
  
  // Fetch participant count - for all users (authenticated or not) - NOVA ESTRUTURA
  // ✅ CORRIGIDO: Usar função RPC que conta corretamente todos os participantes
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count-v2', id],
    queryFn: async () => {
      // Usar função RPC que conta corretamente usando estrutura JSONB e ignorando RLS
      const { data, error } = await supabase.rpc('count_concurso_participants', {
        concurso_id: id
      });
      
      if (error) {
        logger.error('Error fetching participant count', 'USE_RESULTADOS_DATA', error);
        return 0;
      }
      
      return data || 0;
    },
    staleTime: 30000, // 30 segundos para reduzir atualizações
  });
  
  // Verificar se o usuário já está participando deste ranking - NOVA ESTRUTURA
  const { data: userParticipationStatus, isLoading: isCheckingParticipation } = useQuery({
    queryKey: ['user-participation-v2', id, user?.id],
    queryFn: async () => {
      // // Debug logs removed for security
      
      if (!user || !id) {
        // // Debug logs removed for security
        return { isParticipating: false };
      }
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();
        
      // // Debug logs removed for security
        
      if (error) {
        logger.error('Error checking participation', 'USE_RESULTADOS_DATA', error);
        return { isParticipating: false };
      }
      
      // Check if user has this concurso in their consolidated_data
      let isParticipating = false;
      let rankingId = null;
      
      if (data?.consolidated_data?.rankings) {
        Object.entries(data.consolidated_data.rankings).forEach(([rankingIdKey, rankingData]: [string, any]) => {
          if (rankingData.concurso_id === id) {
            isParticipating = true;
            rankingId = rankingIdKey;
          }
        });
      }
      
      const result = { 
        isParticipating,
        rankingId 
      };
      
      // // Debug logs removed for security
      return result;
    },
    enabled: !!user && !!id,
    staleTime: 10000,
  });
  
  // Efeito para configurar polling periódico para atualizações
  // NOTA: Subscription realtime não funciona porque concurso_id está dentro do JSONB
  // Usamos polling a cada 30 segundos para garantir que usuários vejam atualizações
  useEffect(() => {
    if (!id) return;

    // Polling: refetch a cada 30 segundos para garantir atualizações
    const interval = setInterval(() => {
      // Limpar cache local para forçar busca de dados frescos
      rankingCache.clear();
      refetchRankings();
      refetchCount();
    }, 30000); // 30 segundos

    // Cleanup: remover intervalo quando o componente for desmontado
    return () => {
      clearInterval(interval);
    };
  }, [id, refetchRankings, refetchCount]);
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingCount || isLoadingCreator || isCheckingParticipation;
  
  // Function to manually refresh all data with recalculation
  const refreshData = async () => {
    logger.info('Manual refresh initiated', 'USE_RESULTADOS_DATA', { concursoId: id });
    
    if (!id) {
      return { success: false, error: "ID do concurso não fornecido" };
    }
    
    if (isRecalculating) {
      return { success: false, error: "Recálculo já em andamento. Aguarde a conclusão." };
    }
    
    try {
      setIsRecalculating(true);
      setRecalculationProgress({ current: 0, total: 0 });
      
      // ✅ CORRIGIDO: Usar função PostgreSQL recalculate_all_scores_with_weights
      // Esta função já está corrigida para funcionar publicamente e atualizar todos os scores
      logger.info('Calling PostgreSQL batch recalculation function', 'USE_RESULTADOS_DATA');
      
      const recalculationResult = await recalculateAllUserScores(id);
      
      if (!recalculationResult.success) {
        throw new Error(recalculationResult.error || 'Erro ao recalcular pontuações');
      }
      
      logger.info('Batch recalculation completed', 'USE_RESULTADOS_DATA', {
        updatedCount: recalculationResult.updatedCount
      });
      
      // Limpar cache local para garantir dados frescos
      rankingCache.clear();
      
      // Invalidar todas as queries relacionadas para forçar refetch
      queryClient.invalidateQueries({ queryKey: ['rankings', id] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['participant-count', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-count-v2', id] });
      
      // Fazer refetch dos dados atualizados
      await Promise.all([
        refetchRankings(),
        refetchCount(),
      ]);
      
      logger.info('Data refreshed successfully', 'USE_RESULTADOS_DATA', {
        updatedCount: recalculationResult.updatedCount
      });
      
      return { 
        success: true,
        updatedCount: recalculationResult.updatedCount
      };
    } catch (error: any) {
      logger.error('Error refreshing data', 'USE_RESULTADOS_DATA', error);
      return { success: false, error: error.message || String(error) };
    } finally {
      setIsRecalculating(false);
      setRecalculationProgress(null);
    }
  };
  
  // Debug log para verificar o userRankingId
  // console.log('[useResultadosData] Retornando dados:', {
  //   concursoId: id,
  //   isParticipating: userParticipationStatus?.isParticipating || false,
  //   userRankingId: userParticipationStatus?.rankingId,
  //   userParticipationStatus
  // });

  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    isRefetching,
    user,
    refreshData,
    refetchRankings,
    refetchCount,
    creatorName: (() => {
      const name = creatorInfo?.name || (concurso?.is_admin_created ? 'Administrador' : 'Usuário');
      // console.log('[useResultadosData] Creator name calculado:', { 
      //   creatorInfo: creatorInfo?.name, 
      //   is_admin_created: concurso?.is_admin_created, 
      //   finalName: name 
      // });
      return name;
    })(),
    inscritos: concurso?.inscritos || 0,
    // Adiciona informação sobre participação do usuário
    isParticipating: userParticipationStatus?.isParticipating || false,
    userRankingId: userParticipationStatus?.rankingId,
    // Estados de recálculo
    isRecalculating,
    recalculationProgress
  };
}
