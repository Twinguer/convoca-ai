// @ts-nocheck
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserRankings } from '@/services/rankingService';
import { logger } from '@/utils/logger';
import type { Ranking } from '@/services/rankingService';

interface UseRankingsPaginationOptions {
  concursoId: string;
  reservationType?: string;
  initialLimit?: number;
}

interface UseRankingsPaginationReturn {
  rankings: Ranking[];
  isLoading: boolean;
  isRefetching: boolean;
  hasMore: boolean;
  currentPage: number;
  totalLoaded: number;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
}

export const useRankingsPagination = ({
  concursoId,
  reservationType,
  initialLimit = 50
}: UseRankingsPaginationOptions): UseRankingsPaginationReturn => {
  const [allRankings, setAllRankings] = useState<Ranking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['rankings-pagination', concursoId, reservationType, currentPage, initialLimit],
    queryFn: async () => {
      const offset = (currentPage - 1) * initialLimit;
      logger.info('useRankingsPagination queryFn', 'USE_RANKINGS_PAGINATION', {
        concursoId,
        offset,
        limit: initialLimit,
        currentPage
      });
      return fetchUserRankings(concursoId, reservationType, offset, initialLimit);
    },
    enabled: !!concursoId,
    staleTime: 10 * 60 * 1000, // Aumentado para 10 minutos
    refetchOnWindowFocus: false, // Desabilitado para melhor performance
    onSuccess: (data) => {
      if (currentPage === 1) {
        setAllRankings(data);
      } else {
        setAllRankings(prev => [...prev, ...data]);
      }
      setHasMore(data.length === initialLimit);
    },
    onError: (error) => {
      logger.error('Error loading rankings page', 'USE_RANKINGS_PAGINATION', error);
    }
  });

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setAllRankings([]);
    setHasMore(true);
    refetch();
  }, [refetch]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllRankings([]);
    setHasMore(true);
  }, []);

  return {
    rankings: allRankings,
    isLoading: isLoading && currentPage === 1, // Só mostrar loading na primeira página
    isRefetching,
    hasMore,
    currentPage,
    totalLoaded: allRankings.length,
    loadMore,
    refresh,
    reset
  };
};
