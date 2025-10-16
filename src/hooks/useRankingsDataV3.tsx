import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchUserRankingsV3, 
  fetchRankingDataV3, 
  fetchRankingDisciplinesV3, 
  getAvailableReservationTypesV3,
  fetchRankingStatsV3,
  RankingV3,
  RankingDataV3
} from '@/services/rankingServiceV3';
import { logger } from '@/utils/logger';

interface UseRankingsDataV3Options {
  concursoId: string;
  reservationType?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface UseRankingsDataV3Return {
  rankings: RankingV3[];
  rankingData: RankingDataV3 | null;
  disciplines: any[];
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

/**
 * Hook otimizado para buscar dados de rankings V3
 * Usa queries otimizadas com JOIN nativo e paginação eficiente
 */
export const useRankingsDataV3 = ({
  concursoId,
  reservationType,
  page = 1,
  limit = 100,
  enabled = true
}: UseRankingsDataV3Options): UseRankingsDataV3Return => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(page);
  const [totalPages, setTotalPages] = useState(0);

  const offset = (currentPage - 1) * limit;

  // Query para rankings com JOIN nativo otimizado
  const {
    data: rankingsData,
    isLoading: isLoadingRankings,
    isError: isErrorRankings,
    error: errorRankings,
    refetch: refetchRankings
  } = useQuery({
    queryKey: ['rankings-v3', concursoId, reservationType, currentPage, limit],
    queryFn: () => fetchUserRankingsV3(concursoId, reservationType, offset, limit),
    enabled: enabled && !!concursoId,
    staleTime: 2 * 60 * 1000, // 2 minutos (mais agressivo para dados em tempo real)
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Query para dados do ranking
  const {
    data: rankingData,
    isLoading: isLoadingRankingData,
    isError: isErrorRankingData,
    error: errorRankingData
  } = useQuery({
    queryKey: ['ranking-data-v3', concursoId],
    queryFn: () => fetchRankingDataV3(concursoId),
    enabled: enabled && !!concursoId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query para disciplinas
  const {
    data: disciplines,
    isLoading: isLoadingDisciplines,
    isError: isErrorDisciplines,
    error: errorDisciplines
  } = useQuery({
    queryKey: ['ranking-disciplines-v3', concursoId],
    queryFn: () => fetchRankingDisciplinesV3(concursoId),
    enabled: enabled && !!concursoId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Query para tipos de reserva
  const {
    data: reservationTypes,
    isLoading: isLoadingReservationTypes,
    isError: isErrorReservationTypes,
    error: errorReservationTypes
  } = useQuery({
    queryKey: ['ranking-reservation-types-v3', concursoId],
    queryFn: () => getAvailableReservationTypesV3(concursoId),
    enabled: enabled && !!concursoId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Query para estatísticas
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: errorStats
  } = useQuery({
    queryKey: ['ranking-stats-v3', concursoId],
    queryFn: () => fetchRankingStatsV3(concursoId),
    enabled: enabled && !!concursoId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    queryClient.invalidateQueries({ queryKey: ['ranking-data-v3', concursoId] });
    queryClient.invalidateQueries({ queryKey: ['ranking-disciplines-v3', concursoId] });
    queryClient.invalidateQueries({ queryKey: ['ranking-reservation-types-v3', concursoId] });
    queryClient.invalidateQueries({ queryKey: ['ranking-stats-v3', concursoId] });
  }, [concursoId, refetchRankings, queryClient]);

  // Estados combinados
  const isLoading = isLoadingRankings || isLoadingRankingData || isLoadingDisciplines || isLoadingReservationTypes || isLoadingStats;
  const isError = isErrorRankings || isErrorRankingData || isErrorDisciplines || isErrorReservationTypes || isErrorStats;
  const error = errorRankings || errorRankingData || errorDisciplines || errorReservationTypes || errorStats;

  // Log de performance
  useEffect(() => {
    if (rankingsData) {
      logger.performance('useRankingsDataV3', performance.now(), 'HOOK_V3', {
        concursoId,
        page: currentPage,
        count: rankingsData.length
      });
    }
  }, [rankingsData, concursoId, currentPage]);

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

/**
 * Hook para navegação de páginas otimizado
 */
export const useRankingsPaginationV3 = (concursoId: string, limit = 100) => {
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
  } = useRankingsDataV3({
    concursoId,
    reservationType,
    page: currentPage,
    limit,
    enabled: !!concursoId
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

/**
 * Hook para estatísticas de ranking otimizado
 */
export const useRankingStatsV3 = (concursoId: string) => {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ranking-stats-v3', concursoId],
    queryFn: () => fetchRankingStatsV3(concursoId),
    enabled: !!concursoId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  return {
    stats: stats || null,
    isLoading,
    isError,
    error,
    refetch
  };
};
