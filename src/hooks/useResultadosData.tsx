
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = !!user;
  
  // Fetch concurso details
  const { 
    data: concurso, 
    isLoading: isLoadingConcurso,
    refetch: refetchConcurso 
  } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
    staleTime: 60000, // 1 minute
  });
  
  // Fetch creator information if available
  const { 
    data: creatorInfo, 
    isLoading: isLoadingCreator,
    refetch: refetchCreator 
  } = useQuery({
    queryKey: ['creator', concurso?.created_by_user_id],
    queryFn: async () => {
      if (!concurso?.created_by_user_id) return null;
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name')
        .eq('id', concurso.created_by_user_id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching creator info:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!concurso?.created_by_user_id,
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch rankings with more frequent refetching - only if user is authenticated
  const { 
    data: rankings = [], 
    isLoading: isLoadingRankings, 
    refetch: refetchRankings,
    isFetching: isRefetchingRankings
  } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => isAuthenticated ? fetchUserRankings(id) : Promise.resolve([]),
    refetchInterval: 1000, // Reduced to 1 second for more responsive updates
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data immediately stale to ensure fresh data
    enabled: isAuthenticated,
    retry: 3, // Add retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });
  
  // Subscribe to real-time ranking updates
  useEffect(() => {
    if (!id || !isAuthenticated) return;

    console.log('Setting up realtime subscription for rankings...');
    
    const channel = supabase
      .channel('rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rankings',
          filter: `concurso_id=eq.${id}`
        },
        (payload) => {
          console.log('Received ranking update:', payload);
          // Refresh data when rankings change
          refetchRankings();
          
          // Show toast for recalculation updates
          if (payload.eventType === 'UPDATE') {
            toast({
              title: "Ranking atualizado",
              description: "As pontuações foram recalculadas",
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [id, isAuthenticated, refetchRankings, toast]);
  
  // Fetch participant count - for all users (authenticated or not)
  const { 
    data: participantCount = 0, 
    isLoading: isLoadingCount, 
    refetch: refetchCount,
    isFetching: isRefetchingCount
  } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    refetchInterval: 2000, // Reduced to 2 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || (isAuthenticated && isLoadingRankings) || isLoadingCount || isLoadingCreator;
  const isFetching = isRefetchingRankings || isRefetchingCount;
  
  // Function to manually refresh all data
  const refreshData = useCallback(() => {
    console.log("[useResultadosData] Atualizando rankings manualmente");
    
    if (isAuthenticated) {
      refetchRankings();
    }
    
    refetchCount();
    refetchConcurso();
    
    if (concurso?.created_by_user_id) {
      refetchCreator();
    }
    
    toast({
      title: "Dados atualizados",
      description: "Os rankings foram atualizados com sucesso",
      duration: 3000,
    });
  }, [isAuthenticated, refetchRankings, refetchCount, refetchConcurso, refetchCreator, concurso?.created_by_user_id, toast]);
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    isFetching,
    user,
    refreshData,
    creatorName: creatorInfo?.name || (concurso?.is_admin_created ? 'Administrador' : 'Usuário'),
    inscritos: concurso?.inscritos || 0
  };
}
