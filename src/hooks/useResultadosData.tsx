
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || (isAuthenticated && isLoadingRankings) || isLoadingCount || isLoadingCreator;
  
  // Function to manually refresh all data
  const refreshData = () => {
    if (isAuthenticated) {
      console.log("[useResultadosData] Atualizando rankings manualmente");
      refetchRankings();
    }
    refetchCount();
  };
  
  // Check if user is the creator of the ranking
  const isCreator = isAuthenticated && user?.id === concurso?.created_by_user_id;
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    user,
    refreshData,
    creatorName: creatorInfo?.name || 'Usuário',
    inscritos: concurso?.inscritos || 0,
    isCreator
  };
}
