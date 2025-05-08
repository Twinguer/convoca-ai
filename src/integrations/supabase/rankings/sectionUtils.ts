
import { supabase } from '@/integrations/supabase/client';

/**
 * Atualiza os tipos de seções para um gabarito
 */
export const updateSectionTypes = async (concursoId: string) => {
  try {
    const { data, error } = await supabase.rpc('update_section_types', {
      p_concurso_id: concursoId
    });
    
    if (error) {
      console.error('Error updating section types:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating section types:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Verifica as seções disponíveis em um concurso
 */
export const getExamSections = async (concursoId: string) => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select(`
        has_basic_knowledge,
        has_specific_knowledge_1,
        has_specific_knowledge_2,
        has_specific_knowledge_3,
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions
      `)
      .eq('id', concursoId)
      .single();
      
    if (error) throw error;
    
    return {
      hasBasic: data.has_basic_knowledge,
      hasSpecific1: data.has_specific_knowledge_1,
      hasSpecific2: data.has_specific_knowledge_2, 
      hasSpecific3: data.has_specific_knowledge_3,
      basicCount: data.basic_knowledge_questions,
      specific1Count: data.specific_knowledge_1_questions,
      specific2Count: data.specific_knowledge_2_questions,
      specific3Count: data.specific_knowledge_3_questions
    };
  } catch (error) {
    console.error('Error fetching exam sections:', error);
    return {
      hasBasic: false,
      hasSpecific1: false,
      hasSpecific2: false,
      hasSpecific3: false,
      basicCount: 0,
      specific1Count: 0,
      specific2Count: 0,
      specific3Count: 0
    };
  }
};
