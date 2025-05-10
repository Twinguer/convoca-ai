
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/scoreCalculation';
import { Concurso } from '@/types/concursos';

interface AnswerKeyItem {
  concurso_id: string;
  question_number: number;
  correct_answer: string;
  weight: number;
  section_type: string;
  is_nullified: boolean;
}

export const answerKeyService = {
  // Função para salvar o gabarito e recalcular pontuações
  async saveAnswerKeyAndRecalculate(concursoId: string, answerKeyData: AnswerKeyItem[]) {
    try {
      // Atualizar ou inserir cada questão do gabarito
      for (const item of answerKeyData) {
        await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: item.concurso_id,
          p_question_number: item.question_number,
          p_correct_answer: item.correct_answer,
          p_weight: item.weight || 1.0,
          p_is_nullified: item.is_nullified || false,
          p_section_type: item.section_type
        });
      }

      // Recalcular todas as pontuações
      const { data: recalcResult, error: recalcError } = await supabase.rpc(
        'recalculate_all_scores',
        { p_concurso_id: concursoId }
      );

      if (recalcError) throw recalcError;

      return {
        success: true,
        updatedCount: recalcResult?.updatedCount || 0
      };
    } catch (error) {
      console.error('Error saving answer key:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  // Função para obter o gabarito de um concurso
  async getAnswerKey(concursoId: string) {
    try {
      const { data, error } = await supabase.rpc('get_official_answer_weights', {
        p_concurso_id: concursoId
      });

      if (error) throw error;

      return {
        success: true,
        data: data || {}
      };
    } catch (error) {
      console.error('Error fetching answer key:', error);
      return {
        success: false,
        error: (error as Error).message,
        data: {}
      };
    }
  }
};
