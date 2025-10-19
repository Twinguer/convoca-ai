import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchUserRankingsV2, 
  fetchRankingData, 
  fetchRankingDisciplines, 
  getAvailableReservationTypesV2,
  fetchRankingStats,
  RankingV2,
  RankingData,
  RankingDiscipline
} from '@/services/rankingServiceV2';
import { logger } from '@/utils/logger';

interface UseRankingsDataV2Options {
  rankingId: string;
  reservationType?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface UseRankingsDataV2Return {
  rankings: RankingV2[];
  rankingData: RankingData | null;
  disciplines: RankingDiscipline[];
  reservationTypes: string[];
  stats: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  currentPage: number;
}

export const useRankingsDataV2 = ({
  rankingId,
  reservationType,
  page = 1,
  limit = 100,
  enabled = true
}: UseRankingsDataV2Options): UseRankingsDataV2Return => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(page);
  const [totalPages, setTotalPages] = useState(0);

  const offset = (currentPage - 1) * limit;

  // Query para rankings
  const {
    data: rankingsData,
    isLoading: isLoadingRankings,
    isError: isErrorRankings,
    error: errorRankings,
    refetch: refetchRankings
  } = useQuery({
    queryKey: ['rankings-v2', rankingId, reservationType, currentPage, limit],
    queryFn: () => fetchUserRankingsV2(rankingId, reservationType, offset, limit),
    enabled: enabled && !!rankingId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query para dados do ranking
  const {
    data: rankingData,
    isLoading: isLoadingRankingData,
    isError: isErrorRankingData,
    error: errorRankingData
  } = useQuery({
    queryKey: ['ranking-data-v2', rankingId],
    queryFn: () => fetchRankingData(rankingId),
    enabled: enabled && !!rankingId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query para disciplinas
  const {
    data: disciplines,
    isLoading: isLoadingDisciplines,
    isError: isErrorDisciplines,
    error: errorDisciplines
  } = useQuery({
    queryKey: ['ranking-disciplines-v2', rankingId],
    queryFn: () => fetchRankingDisciplines(rankingId),
    enabled: enabled && !!rankingId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query para tipos de reserva
  const {
    data: reservationTypes,
    isLoading: isLoadingReservationTypes,
    isError: isErrorReservationTypes,
    error: errorReservationTypes
  } = useQuery({
    queryKey: ['ranking-reservation-types-v2', rankingId],
    queryFn: () => getAvailableReservationTypesV2(rankingId),
    enabled: enabled && !!rankingId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query para estatísticas
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: errorStats
  } = useQuery({
    queryKey: ['ranking-stats-v2', rankingId],
    queryFn: () => fetchRankingStats(rankingId),
    enabled: enabled && !!rankingId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
  });

  // Calcular paginação
  useEffect(() => {
    if (rankingData?.total_participants) {
      const total = rankingData.total_participants;
      const pages = Math.ceil(total / limit);
      setTotalPages(pages);
    }
  }, [rankingData?.total_participants, limit]);

  // Função para refetch
  const refetch = useCallback(() => {
    refetchRankings();
    queryClient.invalidateQueries({ queryKey: ['ranking-data-v2', rankingId] });
    queryClient.invalidateQueries({ queryKey: ['ranking-disciplines-v2', rankingId] });
    queryClient.invalidateQueries({ queryKey: ['ranking-reservation-types-v2', rankingId] });
    queryClient.invalidateQueries({ queryKey: ['ranking-stats-v2', rankingId] });
  }, [rankingId, refetchRankings, queryClient]);

  // Estados combinados
  const isLoading = isLoadingRankings || isLoadingRankingData || isLoadingDisciplines || isLoadingReservationTypes || isLoadingStats;
  const isError = isErrorRankings || isErrorRankingData || isErrorDisciplines || isErrorReservationTypes || isErrorStats;
  const error = errorRankings || errorRankingData || errorDisciplines || errorReservationTypes || errorStats;

  // Log de performance
  useEffect(() => {
    if (rankingsData) {
      logger.performance('useRankingsDataV2', performance.now(), 'HOOK', {
        rankingId,
        page: currentPage,
        count: rankingsData.length
      });
    }
  }, [rankingsData, rankingId, currentPage]);

  return {
    rankings: rankingsData || [],
    rankingData: rankingData || null,
    disciplines: disciplines || [],
    reservationTypes: reservationTypes || ['Ampla Concorrência'],
    stats: stats || null,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalPages,
    currentPage
  };
};

// Hook para navegação de páginas
export const useRankingsPaginationV2 = (rankingId: string, limit = 100) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [reservationType, setReservationType] = useState<string | undefined>();

  const { 
    rankings, 
    rankingData, 
    isLoading, 
    isError, 
    error, 
    refetch,
    hasNextPage,
    hasPreviousPage,
    totalPages
  } = useRankingsDataV2({
    rankingId,
    reservationType,
    page: currentPage,
    limit,
    enabled: !!rankingId
  });

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const changeReservationType = useCallback((type: string | undefined) => {
    setReservationType(type);
    setCurrentPage(1); // Reset para primeira página
  }, []);

  return {
    rankings,
    rankingData,
    isLoading,
    isError,
    error,
    refetch,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    reservationType,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    changeReservationType
  };
};

// Hook para estatísticas de ranking
export const useRankingStatsV2 = (rankingId: string) => {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ranking-stats-v2', rankingId],
    queryFn: () => fetchRankingStats(rankingId),
    enabled: !!rankingId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    retry: 3,
  });

  return {
    stats: stats || null,
    isLoading,
    isError,
    error,
    refetch
  };
};


















