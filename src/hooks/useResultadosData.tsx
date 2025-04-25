
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings, forceRecalculateAllScores } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
    staleTime: 60000, // 1 minute
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
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch rankings with more frequent refetching
  const { data: rankings = [], isLoading: isLoadingRankings, refetch: refetchRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchInterval: 3000, // 3 seconds
    refetchOnWindowFocus: true,
    staleTime: 1000, // Considered stale after 1 second to ensure frequent updates
  });
  
  // Fetch participant count - for all users (authenticated or not)
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });
  
  // Monitor changes to the answer_key table to trigger updates
  useEffect(() => {
    const channel = supabase
      .channel('answer-key-changes')
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public', 
          table: 'answer_keys', 
          filter: `concurso_id=eq.${id}`
        },
        (payload) => {
          console.log('[useResultadosData] Detected change in answer_keys:', payload);
          // Invalidate the cache immediately when answer key changes
          queryClient.invalidateQueries({ queryKey: ['rankings', id] });
          refetchRankings();
          refetchCount();
        }
      )
      .subscribe();
      
    // Also monitor changes in the score calculation logs table
    const scoresChannel = supabase
      .channel('score-calculation-logs-changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT',
          schema: 'public', 
          table: 'score_calculation_logs'
        },
        (payload) => {
          const details = payload.new?.calculation_details;
          if (details && details.concurso_id === id) {
            console.log('[useResultadosData] Detected score calculation event:', payload);
            queryClient.invalidateQueries({ queryKey: ['rankings', id] });
            refetchRankings();
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(scoresChannel);
    };
  }, [id, queryClient, refetchRankings, refetchCount]);
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || isLoadingRankings || isLoadingCount || isLoadingCreator;
  
  // Function to manually refresh all data
  const refreshData = async () => {
    console.log("[useResultadosData] Manually refreshing rankings");
    
    // Attempt to force recalculation of all scores
    const recalculated = await forceRecalculateAllScores(id);
    if (recalculated) {
      console.log("[useResultadosData] Force recalculation successful");
    }
    
    // Invalidate cached data to ensure fresh fetch
    queryClient.invalidateQueries({ queryKey: ['rankings', id] });
    queryClient.invalidateQueries({ queryKey: ['participant-count', id] });
    
    // Refetch data
    await refetchRankings();
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
