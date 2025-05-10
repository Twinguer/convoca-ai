
import { supabase } from '../client';

/**
 * Atualiza o tipo de seção para todas as questões de um concurso
 */
export const updateSectionTypeForConcurso = async (concursoId: string) => {
  try {
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;

    // Obter a estrutura do exame
    const examStructure = getExamStructure(concurso);
    
    // Atualizar cada questão com seu respectivo tipo de seção
    const { error } = await supabase.rpc('update_question_section_types', { 
      p_concurso_id: concursoId,
      p_basic_end: examStructure.basicEnd,
      p_specific1_end: examStructure.specific1End,
      p_specific2_end: examStructure.specific2End,
      p_specific3_end: examStructure.specific3End,
      p_custom_end: examStructure.customEnd || examStructure.specific3End // Fallback se não houver conhecimentos customizados
    });

    if (error) {
      console.error('Erro ao atualizar tipos de seção:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar tipos de seção:', error);
    return { success: false, error: String(error) };
  }
};

// Helper function to determine exam structure
export const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  // Adiciona as questões de conhecimento customizado
  let customEnd = specific3End;
  if (concurso.has_custom_knowledge && concurso.custom_knowledge_questions) {
    customEnd += concurso.custom_knowledge_questions;
  } else if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Soma todas as questões de disciplinas customizadas
    concurso.disciplines.forEach((discipline: any) => {
      if (discipline.isEnabled && discipline.questionCount) {
        customEnd += discipline.questionCount;
      }
    });
  }
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    customEnd,
    totalQuestions: customEnd
  };
};
