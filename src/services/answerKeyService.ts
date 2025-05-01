
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
  
  // Nova função para salvar o gabarito completo e recalcular pontuações
  async saveAnswerKeyAndRecalculate(concursoId: string, answerKeyData: any[]) {
    try {
      console.log('[answerKeyService] Salvando gabarito completo para concurso:', concursoId);
      
      // Opcionalmente, pode-se deletar o gabarito existente primeiro
      const { error: deleteError } = await supabase
        .from('official_answer_weights')
        .delete()
        .eq('concurso_id', concursoId);
        
      if (deleteError) {
        console.error('[answerKeyService] Erro ao deletar gabarito existente:', deleteError);
        throw deleteError;
      }
      
      // Inserir novo gabarito
      if (answerKeyData.length > 0) {
        const { error: insertError } = await supabase
          .from('official_answer_weights')
          .insert(answerKeyData);
          
        if (insertError) {
          console.error('[answerKeyService] Erro ao inserir novo gabarito:', insertError);
          throw insertError;
        }
      }
      
      // Recalcular pontuações
      console.log('[answerKeyService] Iniciando recálculo de pontuações...');
      const recalcResult = await recalculateAllUserScores(concursoId);
      
      if (!recalcResult.success) {
        console.error('[answerKeyService] Erro no recálculo:', recalcResult.error);
        throw new Error(recalcResult.error);
      }
      
      console.log('[answerKeyService] Recálculo concluído com sucesso:', recalcResult);
      return {
        success: true,
        updatedCount: recalcResult.updatedCount
      };
      
    } catch (error) {
      console.error('[answerKeyService] Erro ao salvar gabarito e recalcular pontuações:', error);
      throw error;
    }
  }
};
