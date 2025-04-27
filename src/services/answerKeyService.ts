
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
    const { data, error } = await supabase.rpc('update_answer_with_weight', {
      p_concurso_id: concursoId,
      p_question_number: questionNumber,
      p_correct_answer: answer,
      p_weight: weight,
      p_is_nullified: isNullified
    });

    if (error) throw error;
    return data;
  },

  // Migrar dados do gabarito antigo para o novo formato
  async migrateAnswerKeys(concursoId: string) {
    const { data, error } = await supabase.rpc('migrate_answer_keys_to_weights');

    if (error) throw error;
    return data;
  }
};
