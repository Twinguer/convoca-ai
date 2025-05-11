
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';
import { answerKeyLogger as logger } from './answerKeyLogger';

/**
 * Função para atualizar o tipo de seção para determinado concurso
 */
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
      
      logger.info(`Atualizando questão ${question.question_number} para section_type: ${sectionType}`);
      
      const { error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: sectionType })
        .eq('id', question.id);
        
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error updating section types:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
