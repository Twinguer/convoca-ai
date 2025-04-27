
import { supabase } from '@/integrations/supabase/client';

interface UpdateAnswerParams {
  concursoId: string;
  questionNumber: number;
  answer: string;
  weight: number;
  isNullified: boolean;
}

export const answerKeyService = {
  // Buscar gabarito oficial com pesos
  async fetchOfficialAnswerWeights(concursoId: string) {
    const { data, error } = await supabase.rpc('get_official_answer_weights', {
      p_concurso_id: concursoId
    });

    if (error) throw error;
    return data;
  },

  // Atualizar resposta com peso
  async updateAnswer({
    concursoId,
    questionNumber,
    answer,
    weight,
    isNullified
  }: UpdateAnswerParams) {
    // Primeiro, atualiza a resposta e peso no banco de dados
    const { data, error } = await supabase.rpc('update_answer_with_weight', {
      p_concurso_id: concursoId,
      p_question_number: questionNumber,
      p_correct_answer: answer,
      p_weight: weight,
      p_is_nullified: isNullified
    });

    if (error) throw error;
    
    // Após atualizar o gabarito, recalcula as pontuações para TODOS os usuários
    const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId
    });
    
    if (recalcError) {
      console.error('Erro ao recalcular pontuações:', recalcError);
      throw recalcError;
    }
    
    console.log('Recálculo de pontuações concluído:', recalcData);
    
    return {
      updateResult: data,
      recalculationResult: recalcData
    };
  },

  // Recalcular pontuações para todos os usuários em um concurso
  async recalculateAllScores(concursoId: string) {
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId
    });

    if (error) {
      console.error('Erro ao recalcular pontuações:', error);
      throw error;
    }
    
    return data;
  },

  // Migrar dados do gabarito antigo para o novo formato
  async migrateAnswerKeys(concursoId: string) {
    const { data, error } = await supabase.rpc('migrate_answer_keys_to_weights');

    if (error) throw error;
    return data;
  }
};
