import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRankingsV2, useUserRankingsV2 } from './useRankings';
import { RankingService } from '@/services/rankingService';
import { useEffect } from 'react';

export function useRankingsV2Data(rankingId?: string) {
  const { id: urlId } = useParams() as { id: string };
  const { user } = useAuth();
  const { 
    fetchRankings, 
    isLoading, 
    error 
  } = useRankingsV2();
  
  // Usar rankingId passado como prop ou do URL
  const id = rankingId || urlId;
  const isAuthenticated = !!user;
  
  // Hook para user rankings
  const {
    userRankings,
    loading: isLoadingUserRankings,
    error: userRankingsError,
    fetchUserRankings,
    refetch: refetchUserRankings
  } = useUserRankingsV2(id);
  
  // Fetch ranking details
  const { data: ranking, isLoading: isLoadingRanking } = useQuery({
    queryKey: ['ranking-v2', id],
    queryFn: async () => {
      if (!id) return null;
      
      // Buscar ranking específico por ID diretamente
      return await RankingService.getRankingById(id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!id,
  });
  
  // isRefetching será controlado pelo hook useUserRankingsV2
  const isRefetching = isLoadingUserRankings;
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? userRankings.find(r => r.user_id === user?.id) : null;
  
  // Check if user is participating
  const isParticipating = !!userRanking;
  
  const isLoadingData = isLoadingRanking || isLoadingUserRankings;
  
  
  // Function to manually refresh all data
  const refreshData = async () => {
    try {
      await Promise.all([
        refetchUserRankings()
      ]);
      return { success: true };
    } catch (error) {
      console.error('Error refreshing data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  return {
    ranking,
    userRankings,
    participantCount: userRankings.length,
    userRanking,
    isLoading: isLoadingData,
    isRefetching,
    user,
    refreshData,
    refetchUserRankings,
    isParticipating,
    error: error || userRankingsError
  };
}
