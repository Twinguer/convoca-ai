
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_official_answer_weights', {
        p_concurso_id: concursoId
      });

      if (error) {
        console.error('Erro ao buscar gabarito:', error);
        throw error;
      }

      return data as OfficialAnswerWeights;
    },
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
        const { data, error } = await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: concursoId,
          p_question_number: questionNumber,
          p_correct_answer: answer,
          p_weight: weight,
          p_is_nullified: isNullified
        });

        if (error) throw error;
        return data;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      toast.success('Gabarito atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['official-answers-weights', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar gabarito:', error);
      toast.error('Erro ao atualizar gabarito');
    }
  });

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
    updateAnswer
  };
};
