
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';
import { Concurso } from '@/types/concursos';

interface AnswerKeyItem {
  concurso_id: string;
  question_number: number;
  correct_answer: string;
  weight: number;
  section_type: string;
  is_nullified: boolean;
}

// Função para atualizar o tipo de seção para determinado concurso
export const updateSectionTypeForConcurso = async (
  concursoId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Primeiro obter o concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Obter todas as questões do gabarito oficial
    const { data: questions, error: questionsError } = await supabase
      .from('official_answer_weights')
      .select('id, question_number')
      .eq('concurso_id', concursoId);
      
    if (questionsError) throw questionsError;
    
    // Para cada questão, atualizar o section_type com base na função de mapeamento
    for (const question of questions || []) {
      const sectionType = getSectionTypeForQuestion(concurso, question.question_number);
      
      const { error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: sectionType })
        .eq('id', question.id);
        
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating section types:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
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
