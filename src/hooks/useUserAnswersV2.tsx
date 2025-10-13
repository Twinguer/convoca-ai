import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchUserAnswers, 
  fetchRankingAnswers, 
  saveUserAnswers, 
  calculateAnswerStats,
  UserAnswerV2,
  RankingAnswerV2,
  AnswerStats
} from '@/services/userAnswersServiceV2';
import { logger } from '@/utils/logger';

interface UseUserAnswersV2Options {
  rankingId: string;
  userId: string;
  enabled?: boolean;
}

interface UseUserAnswersV2Return {
  userAnswers: UserAnswerV2[];
  rankingAnswers: RankingAnswerV2[];
  answerStats: AnswerStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  saveAnswers: (answers: Array<{
    booklet_id: string;
    question_number: number;
    user_answer: string | null;
  }>) => Promise<void>;
  isSaving: boolean;
  saveError: Error | null;
}

export const useUserAnswersV2 = ({
  rankingId,
  userId,
  enabled = true
}: UseUserAnswersV2Options): UseUserAnswersV2Return => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // Query para respostas do usuário
  const {
    data: userAnswers,
    isLoading: isLoadingUserAnswers,
    isError: isErrorUserAnswers,
    error: errorUserAnswers,
    refetch: refetchUserAnswers
  } = useQuery({
    queryKey: ['user-answers-v2', rankingId, userId],
    queryFn: () => fetchUserAnswers(rankingId, userId),
    enabled: enabled && !!rankingId && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
  });

  // Query para gabarito oficial
  const {
    data: rankingAnswers,
    isLoading: isLoadingRankingAnswers,
    isError: isErrorRankingAnswers,
    error: errorRankingAnswers,
    refetch: refetchRankingAnswers
  } = useQuery({
    queryKey: ['ranking-answers-v2', rankingId],
    queryFn: () => fetchRankingAnswers(rankingId),
    enabled: enabled && !!rankingId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    retry: 3,
  });

  // Query para estatísticas
  const {
    data: answerStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: errorStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['answer-stats-v2', rankingId, userId],
    queryFn: () => calculateAnswerStats(rankingId, userId),
    enabled: enabled && !!rankingId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    retry: 3,
  });

  // Mutation para salvar respostas
  const saveAnswersMutation = useMutation({
    mutationFn: (answers: Array<{
      booklet_id: string;
      question_number: number;
      user_answer: string | null;
    }>) => saveUserAnswers(rankingId, userId, answers),
    onSuccess: (data) => {
      logger.ranking('Answers saved successfully V2', `count: ${data.length}`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['user-answers-v2', rankingId, userId] });
      queryClient.invalidateQueries({ queryKey: ['answer-stats-v2', rankingId, userId] });
      queryClient.invalidateQueries({ queryKey: ['rankings-v2', rankingId] });
      queryClient.invalidateQueries({ queryKey: ['ranking-stats-v2', rankingId] });
      
      setSaveError(null);
    },
    onError: (error: Error) => {
      logger.error('Error saving answers V2', 'USER_ANSWERS_HOOK_V2', error);
      setSaveError(error);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  // Função para salvar respostas
  const saveAnswers = useCallback(async (answers: Array<{
    booklet_id: string;
    question_number: number;
    user_answer: string | null;
  }>) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await saveAnswersMutation.mutateAsync(answers);
    } catch (error) {
      // Error já é tratado no onError da mutation
      throw error;
    }
  }, [saveAnswersMutation]);

  // Função para refetch
  const refetch = useCallback(() => {
    refetchUserAnswers();
    refetchRankingAnswers();
    refetchStats();
  }, [refetchUserAnswers, refetchRankingAnswers, refetchStats]);

  // Estados combinados
  const isLoading = isLoadingUserAnswers || isLoadingRankingAnswers || isLoadingStats;
  const isError = isErrorUserAnswers || isErrorRankingAnswers || isErrorStats;
  const error = errorUserAnswers || errorRankingAnswers || errorStats;

  // Log de performance
  useEffect(() => {
    if (userAnswers) {
      logger.performance('useUserAnswersV2', performance.now(), 'HOOK', {
        rankingId,
        userId,
        count: userAnswers.length
      });
    }
  }, [userAnswers, rankingId, userId]);

  return {
    userAnswers: userAnswers || [],
    rankingAnswers: rankingAnswers || [],
    answerStats: answerStats || null,
    isLoading,
    isError,
    error,
    refetch,
    saveAnswers,
    isSaving,
    saveError
  };
};

// Hook para gabarito oficial apenas
export const useRankingAnswersV2 = (rankingId: string, bookletId?: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ranking-answers-v2', rankingId, bookletId],
    queryFn: () => fetchRankingAnswers(rankingId, bookletId),
    enabled: !!rankingId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    retry: 3,
  });

  return {
    rankingAnswers: data || [],
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook para estatísticas de respostas
export const useAnswerStatsV2 = (rankingId: string, userId: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['answer-stats-v2', rankingId, userId],
    queryFn: () => calculateAnswerStats(rankingId, userId),
    enabled: !!rankingId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    retry: 3,
  });

  return {
    stats: data || null,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook para gerenciar respostas com estado local
export const useAnswerManagementV2 = (rankingId: string, userId: string) => {
  const [localAnswers, setLocalAnswers] = useState<Map<string, string | null>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { userAnswers, rankingAnswers, isLoading, isError, error, saveAnswers, isSaving, saveError } = useUserAnswersV2({
    rankingId,
    userId
  });

  // Inicializar respostas locais com dados do servidor
  useEffect(() => {
    if (userAnswers.length > 0) {
      const answersMap = new Map<string, string | null>();
      userAnswers.forEach(answer => {
        const key = `${answer.booklet_id}-${answer.question_number}`;
        answersMap.set(key, answer.user_answer);
      });
      setLocalAnswers(answersMap);
      setHasUnsavedChanges(false);
    }
  }, [userAnswers]);

  // Função para atualizar resposta local
  const updateLocalAnswer = useCallback((bookletId: string, questionNumber: number, answer: string | null) => {
    const key = `${bookletId}-${questionNumber}`;
    setLocalAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(key, answer);
      return newMap;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Função para salvar respostas locais
  const saveLocalAnswers = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    const answersArray = Array.from(localAnswers.entries()).map(([key, answer]) => {
      const [bookletId, questionNumber] = key.split('-');
      return {
        booklet_id: bookletId,
        question_number: parseInt(questionNumber),
        user_answer: answer
      };
    });

    await saveAnswers(answersArray);
    setHasUnsavedChanges(false);
  }, [localAnswers, hasUnsavedChanges, saveAnswers]);

  // Função para obter resposta local
  const getLocalAnswer = useCallback((bookletId: string, questionNumber: number): string | null => {
    const key = `${bookletId}-${questionNumber}`;
    return localAnswers.get(key) || null;
  }, [localAnswers]);

  // Função para limpar mudanças locais
  const clearLocalChanges = useCallback(() => {
    setLocalAnswers(new Map());
    setHasUnsavedChanges(false);
  }, []);

  return {
    localAnswers,
    hasUnsavedChanges,
    userAnswers,
    rankingAnswers,
    isLoading,
    isError,
    error,
    isSaving,
    saveError,
    updateLocalAnswer,
    saveLocalAnswers,
    getLocalAnswer,
    clearLocalChanges
  };
};



