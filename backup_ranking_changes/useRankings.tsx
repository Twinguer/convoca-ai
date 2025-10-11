import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { RankingService } from '@/services/rankingService';
import { 
  CreateRankingNew, 
  UserRankingNew, 
  RankingWithParticipants, 
  UserRankingWithProfile,
  CreateRankingFormData 
} from '@/types/rankingV2';
import { logger } from '@/utils/logger';

/**
 * Hook for managing the new ranking structure (Phase 1)
 * This hook works with create_ranking_new and user_ranking_new tables
 */
export const useRankingsV2 = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingWithParticipants[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch rankings with filters
   */
  const fetchRankings = useCallback(async (filters: {
    titulo?: string;
    orgao?: string;
    banca?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching rankings with filters', { filters });
      const data = await RankingService.getRankingsWithFilters(filters);
      setRankings(data);
      logger.info(`Fetched ${data.length} rankings`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error fetching rankings', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new ranking
   */
  const createRanking = useCallback(async (formData: CreateRankingFormData): Promise<CreateRankingNew | null> => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Creating ranking', { userId: '[REDACTED]', formData: '[REDACTED]' });
      const newRanking = await RankingService.createRanking(user.id, formData);
      
      if (newRanking) {
        // Refresh rankings list
        await fetchRankings();
        logger.info('Ranking created successfully', { rankingId: newRanking.id });
      }
      
      return newRanking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar ranking';
      logger.error('Error creating ranking', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchRankings]);

  /**
   * Get ranking by ID
   */
  const getRankingById = useCallback(async (rankingId: string): Promise<CreateRankingNew | null> => {
    try {
      logger.debug('Getting ranking by ID', { rankingId: '[REDACTED]' });
      return await RankingService.getRankingById(rankingId);
    } catch (err) {
      logger.error('Error getting ranking by ID', err);
      return null;
    }
  }, []);

  // Load rankings on mount
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return {
    rankings,
    loading,
    error,
    fetchRankings,
    createRanking,
    getRankingById
  };
};

/**
 * Hook for managing user rankings
 */
export const useUserRankingsV2 = (rankingId?: string) => {
  const { user } = useAuth();
  const [userRankings, setUserRankings] = useState<UserRankingWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user rankings for a specific ranking
   */
  const fetchUserRankings = useCallback(async (options: {
    reservationType?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    if (!rankingId) return;

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching user rankings for ranking', { rankingId: '[REDACTED]', options: '[REDACTED]' });
      const data = await RankingService.getUserRankingsForRanking(rankingId, options);
      setUserRankings(data);
      logger.info(`Fetched ${data.length} user rankings for ranking`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error fetching user rankings', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [rankingId]);

  /**
   * Add user to ranking
   */
  const addUserToRanking = useCallback(async (reservationType: string = 'Ampla Concorrência'): Promise<UserRankingNew | null> => {
    if (!user?.id || !rankingId) {
      setError('Usuário não autenticado ou ranking não especificado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Adding user to ranking', { userId: '[REDACTED]', rankingId: '[REDACTED]', reservationType });
      const newUserRanking = await RankingService.addUserToRanking(rankingId, user.id, reservationType);
      
      if (newUserRanking) {
        // Refresh user rankings list
        await fetchUserRankings();
        logger.info('User added to ranking successfully', { userRankingId: '[REDACTED]' });
      }
      
      return newUserRanking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar usuário ao ranking';
      logger.error('Error adding user to ranking', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, rankingId, fetchUserRankings]);

  /**
   * Get user ranking by ID
   */
  const getUserRankingById = useCallback(async (userRankingId: string): Promise<UserRankingNew | null> => {
    try {
      logger.debug('Getting user ranking by ID', { userRankingId: '[REDACTED]' });
      return await RankingService.getUserRankingById(userRankingId);
    } catch (err) {
      logger.error('Error getting user ranking by ID', err);
      return null;
    }
  }, []);

  // Load user rankings when rankingId changes
  useEffect(() => {
    if (rankingId) {
      fetchUserRankings();
    }
  }, [rankingId]); // Removido fetchUserRankings da dependência para evitar loop infinito

  return {
    userRankings,
    loading,
    error,
    fetchUserRankings,
    refetch: fetchUserRankings,
    addUserToRanking,
    getUserRankingById
  };
};

/**
 * Hook for managing individual user ranking participation
 */
export const useUserRankingParticipation = (userRankingId?: string) => {
  const [userRanking, setUserRanking] = useState<UserRankingNew | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user ranking data
   */
  const fetchUserRanking = useCallback(async () => {
    if (!userRankingId) return;

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching user ranking', { userRankingId: '[REDACTED]' });
      const data = await RankingService.getUserRankingById(userRankingId);
      setUserRanking(data);
      logger.info('User ranking fetched successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error fetching user ranking', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userRankingId]);

  /**
   * Update user answers
   */
  const updateUserAnswers = useCallback(async (userAnswers: any): Promise<boolean> => {
    if (!userRankingId) {
      setError('ID do ranking do usuário não especificado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Updating user answers', { userRankingId: '[REDACTED]' });
      const success = await RankingService.updateUserAnswers(userRankingId, userAnswers);
      
      if (success) {
        // Refresh user ranking data
        await fetchUserRanking();
        logger.info('User answers updated successfully');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar respostas';
      logger.error('Error updating user answers', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userRankingId, fetchUserRanking]);

  /**
   * Calculate user ranking score
   */
  const calculateScore = useCallback(async (): Promise<any> => {
    if (!userRankingId) {
      setError('ID do ranking do usuário não especificado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Calculating user ranking score', { userRankingId: '[REDACTED]' });
      const calculatedScores = await RankingService.calculateUserRankingScore(userRankingId);
      
      if (calculatedScores) {
        // Refresh user ranking data
        await fetchUserRanking();
        logger.info('User ranking score calculated successfully');
      }
      
      return calculatedScores;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular pontuação';
      logger.error('Error calculating user ranking score', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userRankingId, fetchUserRanking]);

  // Load user ranking when userRankingId changes
  useEffect(() => {
    if (userRankingId) {
      fetchUserRanking();
    }
  }, [userRankingId, fetchUserRanking]);

  return {
    userRanking,
    loading,
    error,
    fetchUserRanking,
    updateUserAnswers,
    calculateScore
  };
};
