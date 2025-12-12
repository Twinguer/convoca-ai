// @ts-nocheck
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
// ✅ CONSOLIDADO: Usar serviço único de rankings
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import { recalculateUserScore } from '@/integrations/supabase/rankings/rankingMutations';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

type ResultadosDataOptions = {
  allowUrlFallback?: boolean;
};

export function useResultadosData(concursoId?: string, options: ResultadosDataOptions = {}) {
  const { allowUrlFallback = true } = options;
  const { id: urlId } = useParams() as { id?: string };
  const resolvedId = concursoId ?? (allowUrlFallback ? urlId : undefined);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Usar concursoId passado como prop ou do URL
  const id = resolvedId;
  
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
  
  // ✅ FASE 1: Configuração para rankings usando V3 (com RPC)
  // ✅ Versão do cache atualizada para forçar invalidação de dados antigos
  const { 
    data: rankings = [], 
    isLoading: isLoadingRankings, 
    refetch: refetchRankings,
    isRefetching
  } = useQuery({
    queryKey: ['rankings-v3', 'v2-tiebreaker-by-date', id],
    queryFn: async () => {
      if (!id) {
        return [];
      }
      try {
        const result = await fetchUserRankings(id, undefined, 0, 100);
        devLog.debug('[useResultadosData] Rankings buscados com sucesso', {
          count: result.length
        });
        return result;
      } catch (error) {
        devLog.error('[useResultadosData] Erro ao chamar fetchUserRankings:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos - dados considerados frescos por 30s
    gcTime: 5 * 60 * 1000, // 5 minutos - manter no cache do React Query por 5min
    refetchOnMount: true, // Revalidar dados ao montar (mas usar cache se ainda estiver fresco)
    enabled: !!id, // HABILITADO - buscar rankings para exibir classificação
    onError: (error) => {
      devLog.error('[useResultadosData] Erro na query:', error);
    }
  });
  
  // Fetch participant count - for all users (authenticated or not) - NOVA ESTRUTURA
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count-v2', id],
    queryFn: async () => {
      // Usar função RPC para contar participantes de forma mais eficiente
      const { data: countData, error: rpcError } = await supabase
        .rpc('count_concurso_participants', { concurso_id: id });
      
      if (!rpcError && countData !== null && countData !== undefined) {
        return countData as number;
      }
      
      // Fallback: contar manualmente se a função RPC não funcionar
      const { data, error } = await supabase
        .from('user_rankings')
        .select('consolidated_data');
      
      if (error) {
        logger.error('Error fetching participant count', 'USE_RESULTADOS_DATA', error);
        return 0;
      }
      
      // Count users who have this concurso in their consolidated_data
      let count = 0;
      if (data) {
        data.forEach(userRanking => {
          if (userRanking.consolidated_data?.rankings) {
            Object.values(userRanking.consolidated_data.rankings).forEach((rankingData: any) => {
              if (rankingData.concurso_id === id) {
                count++;
              }
            });
          }
        });
      }
      
      return count;
    },
    staleTime: 30000, // Aumentado para 30 segundos para reduzir atualizações
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
  
  // Efeito para configurar um canal de escuta para atualizações em tempo real da tabela user_rankings
  useEffect(() => {
    if (!id) return;

    // // Debug logs removed for security

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
          // // Debug logs removed for security
          // Força atualização dos rankings quando houver mudanças
          refetchRankings();
          refetchCount();
        }
      )
      .subscribe();

    // Cleanup: remover inscrição quando o componente for desmontado
    return () => {
      // // Debug logs removed for security
      supabase.removeChannel(channel);
    };
  }, [id, refetchRankings, refetchCount]);
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingCount || isLoadingCreator || isCheckingParticipation;
  
  // Function to manually refresh all data with recalculation
  const refreshData = async () => {
    logger.info('Manual refresh initiated', 'USE_RESULTADOS_DATA', { concursoId: id });
    
    if (!id) {
      devLog.error("[useResultadosData] ID do concurso não fornecido");
      return {
        success: false,
        error: "ID do concurso não fornecido"
      };
    }
    
    // 🔒 VERIFICAR LOCK: Evitar recálculo simultâneo
    if (isRecalculating) {
      logger.warn('Recalculation already in progress', 'USE_RESULTADOS_DATA');
      return {
        success: false,
        error: "Recálculo já em andamento. Aguarde a conclusão."
      };
    }
    
    try {
      // 🔒 ATIVAR LOCK
      setIsRecalculating(true);
      setRecalculationProgress({ current: 0, total: 0 });
      
      // ✅ NOVO: Recalcular scores de todos os participantes ANTES do refetch
      // Debug logs removed for security
      
      // 1. Buscar todos os participantes do concurso
      const { data: allUserRankings, error: fetchError } = await supabase
        .from('user_rankings')
        .select('user_id, consolidated_data');
      
      if (fetchError) {
        throw new Error(`Erro ao buscar participantes: ${fetchError.message}`);
      }
      
      // Filtrar apenas participantes deste concurso
      const participants: string[] = [];
      
      allUserRankings?.forEach(ur => {
        const rankings = ur.consolidated_data?.rankings || {};
        for (const rankingData of Object.values(rankings)) {
          if ((rankingData as any).concurso_id === id) {
            participants.push(ur.user_id);
            break;
          }
        }
      });
      
      // Debug logs removed for security
      setRecalculationProgress({ current: 0, total: participants.length });
      
      // 2. Recalcular cada participante em lotes
      if (participants.length > 0) {
        const batchSize = 50; // Processar 50 por vez
        let processedCount = 0;
        
        for (let i = 0; i < participants.length; i += batchSize) {
          const batch = participants.slice(i, i + batchSize);
          
          // Executar lote em paralelo
          const results = await Promise.allSettled(
            batch.map(userId => recalculateUserScore(userId, id))
          );
          
          // Contar sucessos
          const successful = results.filter(r => r.status === 'fulfilled').length;
          processedCount += successful;
          
          // Atualizar progresso
          setRecalculationProgress({ current: processedCount, total: participants.length });
          
          // Debug logs removed for security
        }
        
        // Debug logs removed for security
      }
      
      // 3. AGORA SIM fazer refetch (que buscará scores ATUALIZADOS)
      // Debug logs removed for security
      await Promise.all([
        refetchRankings(),
        refetchCount()
      ]);
      
      logger.info('Data refreshed successfully', 'USE_RESULTADOS_DATA', {
        participantsRecalculated: participants.length
      });
      
      return { 
        success: true,
        participantsRecalculated: participants.length
      };
      
    } catch (error: any) {
      logger.error('Error refreshing data', 'USE_RESULTADOS_DATA', error);
      return { 
        success: false, 
        error: error.message || String(error) 
      };
    } finally {
      // 🔒 LIBERAR LOCK (sempre, mesmo em erro)
      setIsRecalculating(false);
      setRecalculationProgress(null);
    }
  };
  
  // Debug log para verificar o userRankingId
  // devLog.log('[useResultadosData] Retornando dados:', {
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
      // devLog.log('[useResultadosData] Creator name calculado:', { 
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
