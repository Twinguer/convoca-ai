
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, fetchUserRankings, getParticipantCount } from '@/services/concursoService';
import { useAuth } from '@/hooks/useAuth';

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  basicKnowledgeScore?: number;
  specificKnowledgeScore?: number;
  discursiveScore?: number;
}

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
  });
  
  // Fetch rankings with more frequent refetching
  const { data: rankings, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
    staleTime: 5000, // Consider data stale after 5 seconds
  });
  
  // Fetch participant count
  const { data: participantCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  
  // Find user's ranking
  const userRanking = rankings?.find((r: Ranking) => r.userId === user?.id);
  
  const isLoading = isLoadingConcurso || isLoadingRankings || isLoadingCount;
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    user
  };
}
