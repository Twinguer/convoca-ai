import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook para forçar atualização de todos os dados
 */
export const useForceRefresh = () => {
  const queryClient = useQueryClient();

  const forceRefresh = useCallback(() => {
    console.log('🔄 Forçando atualização de todos os dados...');
    
    // Invalidar todas as queries
    queryClient.invalidateQueries();
    
    // Limpar cache completamente
    queryClient.clear();
    
    // Forçar refetch de queries ativas
    queryClient.refetchQueries();
    
    console.log('✅ Cache limpo e dados atualizados');
  }, [queryClient]);

  const refreshRankings = useCallback((rankingId?: string) => {
    console.log('🔄 Atualizando rankings...');
    
    // Invalidar queries específicas de rankings
    queryClient.invalidateQueries({ queryKey: ['rankings'] });
    queryClient.invalidateQueries({ queryKey: ['rankings-v2'] });
    queryClient.invalidateQueries({ queryKey: ['user-answers'] });
    queryClient.invalidateQueries({ queryKey: ['user-answers-v2'] });
    queryClient.invalidateQueries({ queryKey: ['answer-stats'] });
    queryClient.invalidateQueries({ queryKey: ['user-ranking-detail'] });
    
    if (rankingId) {
      queryClient.invalidateQueries({ queryKey: ['rankings', rankingId] });
      queryClient.invalidateQueries({ queryKey: ['rankings-v2', rankingId] });
    }
    
    console.log('✅ Rankings atualizados');
  }, [queryClient]);

  return {
    forceRefresh,
    refreshRankings
  };
};
