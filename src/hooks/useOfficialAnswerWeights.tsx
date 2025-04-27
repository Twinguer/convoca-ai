
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { answerKeyService } from '@/services/answerKeyService';

interface AnswerWeight {
  resposta: string;
  peso: number;
  secao: 'basic' | 'specific1' | 'specific2' | 'specific3';
  anulada: boolean;
}

interface OfficialAnswerWeights {
  [key: string]: AnswerWeight;
}

export const useOfficialAnswerWeights = (concursoId: string) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Buscar gabarito oficial com pesos
  const { data: officialAnswers, isLoading } = useQuery({
    queryKey: ['official-answers-weights', concursoId],
    queryFn: () => answerKeyService.fetchOfficialAnswerWeights(concursoId),
  });

  // Mutação para atualizar resposta e peso
  const updateAnswerMutation = useMutation({
    mutationFn: async ({ 
      questionNumber, 
      answer, 
      weight, 
      isNullified 
    }: { 
      questionNumber: number; 
      answer: string; 
      weight: number;
      isNullified: boolean;
    }) => {
      setIsUpdating(true);
      
      try {
        // Usa o serviço answerKeyService para atualizar e recalcular
        const result = await answerKeyService.updateAnswer({
          concursoId,
          questionNumber,
          answer,
          weight,
          isNullified
        });
        
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (data) => {
      toast.success('Gabarito atualizado e pontuações recalculadas com sucesso');
      
      // Invalidar os caches relacionados para garantir que os dados serão atualizados
      queryClient.invalidateQueries({ queryKey: ['official-answers-weights', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
      
      // Invalidar todos os rankings, não apenas o do concurso específico
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      
      console.log('Recálculo concluído:', data?.recalculationResult);
    },
    onError: (error) => {
      console.error('Erro ao atualizar gabarito:', error);
      toast.error('Erro ao atualizar gabarito: ' + (error as Error).message);
    }
  });

  // Função para recalcular todas as pontuações
  const recalculateAllScores = async () => {
    setIsUpdating(true);
    try {
      const result = await answerKeyService.recalculateAllScores(concursoId);
      
      toast.success('Pontuações recalculadas com sucesso');
      
      // Invalidar os caches relacionados
      queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      
      return result;
    } catch (error) {
      console.error('Erro ao recalcular pontuações:', error);
      toast.error('Erro ao recalcular pontuações: ' + (error as Error).message);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para atualizar uma resposta específica
  const updateAnswer = (
    questionNumber: number, 
    answer: string, 
    weight: number = 1.0,
    isNullified: boolean = false
  ) => {
    return updateAnswerMutation.mutate({ 
      questionNumber, 
      answer, 
      weight,
      isNullified 
    });
  };

  return {
    officialAnswers,
    isLoading,
    isUpdating,
    updateAnswer,
    recalculateAllScores
  };
};
