
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
  });
  
  // Fetch rankings with more frequent refetching
  const { data: rankings, isLoading: isLoadingRankings, refetch: refetchRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    staleTime: 2000, // Consider data stale after 2 seconds
  });
  
  // Fetch participant count
  const { data: participantCount, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  
  // Find user's ranking
  const userRanking = rankings?.find((r: Ranking) => r.userId === user?.id);
  
  const isLoading = isLoadingConcurso || isLoadingRankings || isLoadingCount;
  
  // Function to manually refresh all data
  const refreshData = () => {
    refetchRankings();
    refetchCount();
  };
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    user,
    refreshData
  };
}
