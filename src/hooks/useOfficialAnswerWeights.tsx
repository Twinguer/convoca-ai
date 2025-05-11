
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';

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
    staleTime: 30000, // Aumentado para 30 segundos para reduzir consultas
  });

  // Mutação para atualizar resposta e peso
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
        console.log('Atualizando gabarito:', {
          concursoId,
          questionNumber,
          answer,
          weight,
          isNullified,
          sectionType
        });

        // Primeiro, buscar informações do concurso para garantir que temos v_concurso
        const { data: concursoData, error: concursoError } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', concursoId)
          .single();
        
        if (concursoError) {
          throw new Error(`Erro ao buscar informações do concurso: ${concursoError.message}`);
        }
        
        // Agora podemos chamar a função RPC com garantia que o concurso existe
        const { data, error } = await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: concursoId,
          p_question_number: questionNumber,
          p_correct_answer: answer,
          p_weight: weight,
          p_is_nullified: isNullified,
          p_section_type: sectionType
        });

        if (error) throw error;
        
        // Força recálculo para todos os usuários após atualização do gabarito
        // Esta é a única parte onde devemos ter atualização automática
        const recalcResult = await recalculateAllUserScores(concursoId);
        
        if (!recalcResult.success) {
          console.warn('Aviso: Recálculo de pontuações falhou após atualização do gabarito:', recalcResult.error);
        } else {
          console.log(`Pontuações recalculadas para ${recalcResult.updatedCount} usuários após atualização do gabarito`);
        }
        
        return data;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      toast.success('Gabarito atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['official-answers-weights', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
      
      // Invalidar também nullified-questions para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['nullified-questions', concursoId] });
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
