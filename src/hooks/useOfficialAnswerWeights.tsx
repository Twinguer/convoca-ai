
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { getAllBookletsAnswerKeys } from '@/services/answerKeyService';

interface AnswerWeight {
  resposta: string;
  peso: number;
  secao: 'basic' | 'specific1' | 'specific2' | 'specific3' | string;
  anulada: boolean;
}

interface OfficialAnswerWeights {
  [key: string]: AnswerWeight;
}

export const useOfficialAnswerWeights = (concursoId: string) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Buscar gabarito oficial consolidado
  const { data: officialAnswers, isLoading } = useQuery({
    queryKey: ['official-answers-weights', concursoId],
    queryFn: async () => {
      console.log('[useOfficialAnswerWeights] Fetching consolidated answer key for:', concursoId);
      
      const result = await getAllBookletsAnswerKeys(concursoId);
      
      if (!result.success) {
        console.error('[useOfficialAnswerWeights] Error:', result.error);
        throw new Error(result.error);
      }

      // Transform consolidated data to legacy format for backwards compatibility
      const transformedData: OfficialAnswerWeights = {};
      
      if (result.data?.booklets) {
        // Use the default booklet or the first available booklet
        const bookletId = 'default';
        let bookletData = result.data.booklets[bookletId];
        
        // If default doesn't exist, use the first available booklet
        if (!bookletData && Object.keys(result.data.booklets).length > 0) {
          const firstBookletId = Object.keys(result.data.booklets)[0];
          bookletData = result.data.booklets[firstBookletId];
        }
        
        if (bookletData?.answers) {
          Object.entries(bookletData.answers).forEach(([questionNum, answerData]: [string, any]) => {
            const questionKey = `questao${questionNum}`;
            transformedData[questionKey] = {
              resposta: answerData.correct_answer,
              peso: answerData.weight || 1,
              secao: answerData.section_type || 'basic',
              anulada: answerData.is_nullified || false
            };
          });
        }
      }

      return transformedData;
    },
    staleTime: 30000,
  });

  // Mutação para atualizar resposta e peso usando a nova estrutura simplificada
  const updateAnswerMutation = useMutation({
    mutationFn: async ({ 
      questionNumber, 
      answer, 
      weight, 
      isNullified,
      sectionType 
    }: { 
      questionNumber: number; 
      answer: string; 
      weight: number;
      isNullified: boolean;
      sectionType?: string;
    }) => {
      setIsUpdating(true);
      
      try {
        console.log('Updating consolidated answer key:', {
          concursoId,
          questionNumber,
          answer,
          weight,
          isNullified,
          sectionType
        });

        // Use the updated function to update individual answers
        const { data, error } = await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: concursoId,
          p_question_number: questionNumber,
          p_correct_answer: answer,
          p_weight: weight,
          p_is_nullified: isNullified,
          p_section_type: sectionType || 'basic'
        });

        if (error) throw error;
        
        // Force recalculation for all users after answer key update
        const recalcResult = await recalculateAllUserScores(concursoId);
        
        if (!recalcResult.success) {
          console.warn('Warning: Score recalculation failed after answer key update:', recalcResult.error);
        } else {
          console.log(`Scores recalculated for ${recalcResult.updatedCount} users after answer key update`);
        }
        
        return data;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      toast.success('Gabarito atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['official-answers-weights', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-answer-key', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
      
      // Invalidate nullified-questions to update UI
      queryClient.invalidateQueries({ queryKey: ['nullified-questions', concursoId] });
    },
    onError: (error) => {
      console.error('Error updating answer key:', error);
      toast.error('Erro ao atualizar gabarito');
    }
  });

  // Function to update a specific answer
  const updateAnswer = (
    questionNumber: number, 
    answer: string, 
    weight: number = 1.0,
    isNullified: boolean = false,
    sectionType?: string
  ) => {
    return updateAnswerMutation.mutate({ 
      questionNumber, 
      answer, 
      weight,
      isNullified,
      sectionType 
    });
  };

  return {
    officialAnswers,
    isLoading,
    isUpdating,
    updateAnswer
  };
};
