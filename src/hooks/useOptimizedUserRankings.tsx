/**
 * HOOK OTIMIZADO PARA USER_RANKINGS
 * 
 * Este hook React foi projetado para trabalhar com a nova estrutura JSONB
 * otimizada, oferecendo:
 * 
 * 1. Cache inteligente com React Query
 * 2. Invalidação automática de dados
 * 3. Otimizações de performance
 * 4. Tratamento de erros robusto
 * 5. TypeScript completo
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import OptimizedUserRankingsService from '@/services/optimizedUserRankingsService';
import { 
  ConsolidatedUserRankings, 
  UserRankingData, 
  RankingSummary,
  QuotaType,
  RankingStatus 
} from '@/types/userRankings';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const userRankingsKeys = {
  all: ['userRankings'] as const,
  user: (userId: string) => [...userRankingsKeys.all, 'user', userId] as const,
  userRankings: (userId: string) => [...userRankingsKeys.user(userId), 'rankings'] as const,
  userRanking: (userId: string, concursoId: string) => [...userRankingsKeys.user(userId), 'ranking', concursoId] as const,
  concurso: (concursoId: string) => [...userRankingsKeys.all, 'concurso', concursoId] as const,
  concursoRankings: (concursoId: string) => [...userRankingsKeys.concurso(concursoId), 'rankings'] as const,
  summaries: (userId: string) => [...userRankingsKeys.user(userId), 'summaries'] as const,
  positions: (concursoId: string) => [...userRankingsKeys.concurso(concursoId), 'positions'] as const,
};

// ============================================================================
// HOOKS PRINCIPAIS
// ============================================================================

/**
 * Hook para buscar todos os rankings de um usuário
 */
export const useUserRankings = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: userRankingsKeys.userRankings(targetUserId || ''),
    queryFn: () => OptimizedUserRankingsService.getUserRankings(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para buscar ranking específico de um usuário em um concurso
 */
export const useUserRankingByConcurso = (concursoId: string, userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: userRankingsKeys.userRanking(targetUserId || '', concursoId),
    queryFn: () => OptimizedUserRankingsService.getUserRankingByConcurso(targetUserId!, concursoId),
    enabled: !!targetUserId && !!concursoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para buscar todos os rankings de um concurso
 */
export const useConcursoRankings = (concursoId: string) => {
  return useQuery({
    queryKey: userRankingsKeys.concursoRankings(concursoId),
    queryFn: () => OptimizedUserRankingsService.getConcursoRankings(concursoId),
    enabled: !!concursoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 3 * 60 * 1000, // 3 minutos
  });
};

/**
 * Hook para buscar resumos dos rankings de um usuário
 */
export const useUserRankingSummaries = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: userRankingsKeys.summaries(targetUserId || ''),
    queryFn: () => OptimizedUserRankingsService.getUserRankingSummaries(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para calcular posições de um concurso
 */
export const useConcursoPositions = (concursoId: string) => {
  return useQuery({
    queryKey: userRankingsKeys.positions(concursoId),
    queryFn: () => OptimizedUserRankingsService.calculateConcursoPositions(concursoId),
    enabled: !!concursoId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
  });
};

// ============================================================================
// HOOKS DE MUTAÇÃO
// ============================================================================

/**
 * Hook para criar ou atualizar ranking
 */
export const useUpsertUserRanking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      rankingId, 
      rankingData 
    }: { 
      rankingId: string; 
      rankingData: UserRankingData; 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return OptimizedUserRankingsService.upsertUserRanking(user.id, rankingId, rankingData);
    },
    onSuccess: (_, { rankingData }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: userRankingsKeys.user(user?.id || '')
      });
      queryClient.invalidateQueries({
        queryKey: userRankingsKeys.concurso(rankingData.concurso_id)
      });
    },
  });
};

/**
 * Hook para remover ranking
 */
export const useRemoveUserRanking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      rankingId, 
      concursoId 
    }: { 
      rankingId: string; 
      concursoId: string; 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return OptimizedUserRankingsService.removeUserRanking(user.id, rankingId);
    },
    onSuccess: (_, { concursoId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: userRankingsKeys.user(user?.id || '')
      });
      queryClient.invalidateQueries({
        queryKey: userRankingsKeys.concurso(concursoId)
      });
    },
  });
};

/**
 * Hook para participar de um concurso
 */
export const useParticipateInConcurso = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      concursoId, 
      bookletId, 
      reservationType 
    }: { 
      concursoId: string; 
      bookletId: string; 
      reservationType: QuotaType; 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Verificar se pode participar
      const canParticipate = await OptimizedUserRankingsService.canUserParticipate(user.id, concursoId);
      if (!canParticipate.canParticipate) {
        throw new Error(canParticipate.reason || 'Não é possível participar deste concurso');
      }
      
      // Criar ranking inicial
      const rankingId = OptimizedUserRankingsService.generateRankingId(concursoId, user.id);
      const rankingData = OptimizedUserRankingsService.createInitialRankingData(
        concursoId,
        bookletId,
        reservationType
      );
      
      return OptimizedUserRankingsService.upsertUserRanking(user.id, rankingId, rankingData);
    },
    onSuccess: (_, { concursoId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: userRankingsKeys.user(user?.id || '')
      });
      queryClient.invalidateQueries({
        queryKey: userRankingsKeys.concurso(concursoId)
      });
    },
  });
};

// ============================================================================
// HOOKS DE UTILIDADE
// ============================================================================

/**
 * Hook para verificar se usuário pode participar de um concurso
 */
export const useCanParticipate = (concursoId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['canParticipate', user?.id, concursoId],
    queryFn: () => OptimizedUserRankingsService.canUserParticipate(user!.id, concursoId),
    enabled: !!user?.id && !!concursoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

/**
 * Hook para estatísticas de cota
 */
export const useQuotaStatistics = (concursoId: string, quotaType: QuotaType) => {
  return useQuery({
    queryKey: ['quotaStatistics', concursoId, quotaType],
    queryFn: () => OptimizedUserRankingsService.calculateQuotaStatistics(concursoId, quotaType),
    enabled: !!concursoId && !!quotaType,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// ============================================================================
// HOOKS COMPOSTOS
// ============================================================================

/**
 * Hook completo para gerenciar participação em concurso
 */
export const useConcursoParticipation = (concursoId: string) => {
  const { user } = useAuth();
  const userRanking = useUserRankingByConcurso(concursoId, user?.id);
  const canParticipate = useCanParticipate(concursoId);
  const participateMutation = useParticipateInConcurso();
  const removeMutation = useRemoveUserRanking();
  
  return {
    // Dados
    userRanking: userRanking.data,
    isLoading: userRanking.isLoading,
    error: userRanking.error,
    
    // Estado de participação
    isParticipating: !!userRanking.data,
    canParticipate: canParticipate.data?.canParticipate || false,
    participationReason: canParticipate.data?.reason,
    
    // Ações
    participate: participateMutation.mutate,
    remove: removeMutation.mutate,
    
    // Estados de loading
    isParticipating: participateMutation.isPending,
    isRemoving: removeMutation.isPending,
    
    // Erros
    participationError: participateMutation.error,
    removalError: removeMutation.error,
  };
};

/**
 * Hook para dashboard de rankings do usuário
 */
export const useUserRankingsDashboard = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const rankings = useUserRankings(targetUserId);
  const summaries = useUserRankingSummaries(targetUserId);
  
  return {
    // Dados
    rankings: rankings.data,
    summaries: summaries.data,
    
    // Estados
    isLoading: rankings.isLoading || summaries.isLoading,
    error: rankings.error || summaries.error,
    
    // Estatísticas calculadas
    totalRankings: summaries.data?.length || 0,
    activeRankings: summaries.data?.filter(s => s.status === 'participando').length || 0,
    classifiedRankings: summaries.data?.filter(s => s.status === 'classificado').length || 0,
    averageScore: summaries.data?.length ? 
      summaries.data.reduce((sum, s) => sum + s.score, 0) / summaries.data.length : 0,
  };
};

export default {
  useUserRankings,
  useUserRankingByConcurso,
  useConcursoRankings,
  useUserRankingSummaries,
  useConcursoPositions,
  useUpsertUserRanking,
  useRemoveUserRanking,
  useParticipateInConcurso,
  useCanParticipate,
  useQuotaStatistics,
  useConcursoParticipation,
  useUserRankingsDashboard,
};













