
import { supabase } from "@/integrations/supabase/client";

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
    
    // Forçar o recálculo para todos os usuários do concurso
    try {
      const recalcResult = await supabase.rpc('recalculate_all_scores', {
        p_concurso_id: concursoId
      });
      console.log('[answerKeyService] Recálculo de todos os rankings:', recalcResult);
    } catch (recalcError) {
      console.error('[answerKeyService] Erro ao recalcular todas as pontuações:', recalcError);
    }
    
    return data;
  },
};
