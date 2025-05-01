
import { supabase } from "@/integrations/supabase/client";
import { recalculateAllUserScores } from "@/integrations/supabase/rankings/batchOperations";

interface UpdateAnswerParams {
  concursoId: string;
  questionNumber: number;
  answer: string;
  weight: number;
  sectionType?: string;
  isNullified: boolean;
}

export const answerKeyService = {
  // Buscar gabarito oficial com pesos
  async fetchOfficialAnswerWeights(concursoId: string) {
    const { data, error } = await supabase.rpc('get_official_answer_weights', {
      p_concurso_id: concursoId,
    });

    if (error) throw error;
    return data;
  },

  async updateAnswer(
    {
      concursoId,
      questionNumber,
      answer,
      weight,
      isNullified,
      sectionType
    }: UpdateAnswerParams
  ) {  
    const { data, error } = await supabase.rpc("update_answer_with_weight", {
      p_concurso_id: concursoId,
      p_question_number: questionNumber,
      p_correct_answer: answer,
      p_weight: weight,
      p_is_nullified: isNullified,
      p_section_type: sectionType
    });

    if (error) throw error;
    
    // Forçar o recálculo para todos os usuários do concurso usando a função otimizada
    try {
      console.log('[answerKeyService] Recalculando pontuações para todos os usuários...');
      const recalcResult = await recalculateAllUserScores(concursoId);
      
      if (recalcResult.success) {
        console.log('[answerKeyService] Recálculo bem-sucedido para todos os usuários:', recalcResult);
        return {
          success: true,
          data,
          updatedCount: recalcResult.updatedCount
        };
      } else {
        console.error('[answerKeyService] Erro ao recalcular pontuações:', recalcResult.error);
        throw new Error(recalcResult.error);
      }
    } catch (recalcError) {
      console.error('[answerKeyService] Erro ao recalcular todas as pontuações:', recalcError);
      throw recalcError;
    }
  },
};
