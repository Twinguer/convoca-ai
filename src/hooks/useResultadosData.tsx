
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
      console.log('[useResultadosData] ===== BUSCANDO CRIADOR =====');
      console.log('[useResultadosData] Concurso completo:', concurso);
      console.log('[useResultadosData] created_by_user_id:', concurso?.created_by_user_id);
      console.log('[useResultadosData] is_admin_created:', concurso?.is_admin_created);
      
      if (!concurso?.created_by_user_id) {
        console.log('[useResultadosData] ❌ created_by_user_id não disponível');
        return null;
      }
      
      console.log('[useResultadosData] 🔍 Executando query para buscar criador...');
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name')
        .eq('id', concurso.created_by_user_id)
        .single();
        
      console.log('[useResultadosData] 📊 Resultado da query de criador:', { data, error });
        
      if (error) {
        console.log('[useResultadosData] ❌ Erro na query:', error);
        logger.error('Error fetching creator info', 'USE_RESULTADOS_DATA', error);
        return null;
      }
      
      console.log('[useResultadosData] ✅ Criador encontrado:', data);
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
    enabled: !!id, // HABILITADO - buscar rankings para exibir classificação
  });
  
  // Fetch participant count - for all users (authenticated or not) - NOVA ESTRUTURA
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count-v2', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id', { count: 'exact' })
        .eq('concurso_id', id);
      
      if (error) {
        logger.error('Error fetching participant count', 'USE_RESULTADOS_DATA', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    staleTime: 30000, // Aumentado para 30 segundos para reduzir atualizações
  });
  
  // Verificar se o usuário já está participando deste ranking - NOVA ESTRUTURA
  const { data: userParticipationStatus, isLoading: isCheckingParticipation } = useQuery({
    queryKey: ['user-participation-v2', id, user?.id],
    queryFn: async () => {
      console.log('[useResultadosData] Verificando participação do usuário:', { userId: user?.id, concursoId: id });
      
      if (!user || !id) {
        console.log('[useResultadosData] Usuário ou ID não disponível');
        return { isParticipating: false };
      }
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('concurso_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      console.log('[useResultadosData] Resultado da query de participação:', { data, error });
        
      if (error) {
        logger.error('Error checking participation', 'USE_RESULTADOS_DATA', error);
        return { isParticipating: false };
      }
      
      const result = { 
        isParticipating: !!data,
        rankingId: data?.id 
      };
      
      console.log('[useResultadosData] Status de participação:', result);
      return result;
    },
    enabled: !!user && !!id,
    staleTime: 10000,
  });
  
  // Efeito para configurar um canal de escuta para atualizações em tempo real da tabela user_rankings
  useEffect(() => {
    if (!id) return;

    console.log('[useResultadosData] Configurando real-time para concurso:', id);

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
          console.log('[useResultadosData] 🔄 Detected change in user_rankings:', payload);
          // Força atualização dos rankings quando houver mudanças
          refetchRankings();
          refetchCount();
        }
      )
      .subscribe();

    // Cleanup: remover inscrição quando o componente for desmontado
    return () => {
      console.log('[useResultadosData] Limpando real-time channel');
      supabase.removeChannel(channel);
    };
  }, [id, refetchRankings, refetchCount]);
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingCount || isLoadingCreator || isCheckingParticipation;
  
  // Function to manually refresh all data
  const refreshData = async () => {
    console.log("[useResultadosData] ===== INÍCIO refreshData =====");
    console.log("[useResultadosData] Atualizando rankings manualmente");
    console.log("[useResultadosData] ID do concurso:", id);
    console.log("[useResultadosData] Usuário autenticado:", isAuthenticated);
    console.log("[useResultadosData] Timestamp:", new Date().toISOString());
    
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
      logger.info('Usuário não autenticado, atualizando apenas os dados locais', 'USE_RESULTADOS_DATA');
      
      try {
        console.log("[useResultadosData] Chamando refetchRankings...");
        await refetchRankings();
        console.log("[useResultadosData] refetchRankings concluído");
        
        console.log("[useResultadosData] Chamando refetchCount...");
        await refetchCount();
        console.log("[useResultadosData] refetchCount concluído");
      } catch (error) {
        console.error("[useResultadosData] Erro ao atualizar dados locais:", error);
      }
      
      return {
        success: true,
        message: "Dados atualizados localmente"
      };
    }
      
    // Recalcular pontuações para todos os usuários apenas se autenticado
    try {
      console.log("[useResultadosData] ===== INICIANDO RECÁLCULO =====");
      console.log("[useResultadosData] Chamando recalculateAllUserScores para concurso:", id);
      logger.info('Chamando recalculateAllUserScores para concurso', 'USE_RESULTADOS_DATA', { concursoId: id });
      
      const result = await recalculateAllUserScores(id);
      console.log("[useResultadosData] ===== RESULTADO RECÁLCULO =====");
      console.log("[useResultadosData] Resultado do recalculateAllUserScores:", result);
      
      if (!result.success) {
        console.error("[useResultadosData] ===== ERRO NO RECÁLCULO =====");
        console.error("[useResultadosData] Erro ao recalcular pontuações:", result.error);
        logger.error('Erro ao recalcular pontuações', 'USE_RESULTADOS_DATA', result.error);
        return { success: false, error: result.error };
      } else {
        console.log("[useResultadosData] ===== RECÁLCULO BEM-SUCEDIDO =====");
        console.log("[useResultadosData] Pontuações recalculadas com sucesso:", result);
        logger.info('Pontuações recalculadas com sucesso', 'USE_RESULTADOS_DATA', result);
        
        // Força imediatamente uma atualização dos dados
        console.log("[useResultadosData] ===== ATUALIZANDO UI =====");
        console.log("[useResultadosData] Atualizando rankings e contagem...");
        
        try {
          console.log("[useResultadosData] Chamando refetchRankings...");
          await refetchRankings();
          console.log("[useResultadosData] ===== RANKINGS ATUALIZADOS =====");
          console.log("[useResultadosData] Rankings atualizados com sucesso");
        } catch (refetchError) {
          console.error("[useResultadosData] ===== ERRO AO ATUALIZAR RANKINGS =====");
          console.error("[useResultadosData] Erro ao atualizar rankings:", refetchError);
        }
        
        try {
          console.log("[useResultadosData] Chamando refetchCount...");
          await refetchCount();
          console.log("[useResultadosData] ===== CONTAGEM ATUALIZADA =====");
          console.log("[useResultadosData] Contagem atualizada com sucesso");
        } catch (countError) {
          console.error("[useResultadosData] ===== ERRO AO ATUALIZAR CONTAGEM =====");
          console.error("[useResultadosData] Erro ao atualizar contagem:", countError);
        }
        
        console.log("[useResultadosData] ===== FIM refreshData =====");
        console.log("[useResultadosData] Rankings e contagem atualizados");
        
        return { success: true, updatedCount: result.updatedCount };
      }
    } catch (err) {
      console.error("[useResultadosData] ===== ERRO INESPERADO =====");
      console.error("[useResultadosData] Erro inesperado ao recalcular pontuações:", err);
      logger.error('Erro inesperado ao recalcular pontuações', 'USE_RESULTADOS_DATA', err);
      return { success: false, error: String(err) };
    }
  };
  
  // Debug log para verificar o userRankingId
  console.log('[useResultadosData] Retornando dados:', {
    concursoId: id,
    isParticipating: userParticipationStatus?.isParticipating || false,
    userRankingId: userParticipationStatus?.rankingId,
    userParticipationStatus
  });

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
      console.log('[useResultadosData] Creator name calculado:', { 
        creatorInfo: creatorInfo?.name, 
        is_admin_created: concurso?.is_admin_created, 
        finalName: name 
      });
      return name;
    })(),
    inscritos: concurso?.inscritos || 0,
    // Adiciona informação sobre participação do usuário
    isParticipating: userParticipationStatus?.isParticipating || false,
    userRankingId: userParticipationStatus?.rankingId
  };
}
