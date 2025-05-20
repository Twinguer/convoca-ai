
import { Concurso } from '@/types/concursos';
import { getDisciplines, getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';
import { supabase } from '@/integrations/supabase/client';

export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  let total = 0;
  
  // Contar questões de todas as disciplinas habilitadas
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso);
    
    if (hierarchical) {
      // Contar em estrutura hierárquica
      for (const block of concurso.disciplines as any[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              total += getNumericValue(discipline.questionCount);
            }
          }
        }
      }
      return total;
    }
    
    // Contar em estrutura plana
    for (const discipline of concurso.disciplines) {
      if (discipline.isEnabled) {
        total += getNumericValue(discipline.questionCount);
      }
    }
    return total;
  }
  
  // Estrutura tradicional
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    total += getNumericValue(concurso.basic_knowledge_questions);
  }
  
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    total += getNumericValue(concurso.specific_knowledge_1_questions);
  }
  
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    total += getNumericValue(concurso.specific_knowledge_2_questions);
  }
  
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    total += getNumericValue(concurso.specific_knowledge_3_questions);
  }
  
  return total;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  return Object.keys(answers).length;
};

// Nova função para verificar se existem questões nulas que não estão no gabarito
export const checkMissingOfficialAnswers = async (concursoId: string) => {
  try {
    console.log(`[checkMissingOfficialAnswers] Verificando gabarito oficial para concurso: ${concursoId}`);
    
    // Buscar o concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      console.error('[checkMissingOfficialAnswers] Erro ao buscar concurso:', concursoError);
      return { missing: true, error: concursoError.message };
    }
    
    // Calcular quantas questões deveriam existir
    const expectedQuestions = getTotalQuestions(concurso);
    
    // Buscar quantas questões existem no gabarito
    const { data: officialAnswers, error: answersError } = await supabase
      .from('official_answer_weights')
      .select('question_number, correct_answer')
      .eq('concurso_id', concursoId);
      
    if (answersError) {
      console.error('[checkMissingOfficialAnswers] Erro ao buscar gabarito:', answersError);
      return { missing: true, error: answersError.message };
    }
    
    console.log(`[checkMissingOfficialAnswers] Questões esperadas: ${expectedQuestions}, Encontradas: ${officialAnswers?.length || 0}`);
    
    // Se não encontrou nenhuma questão ou encontrou menos do que o esperado
    if (!officialAnswers || officialAnswers.length < expectedQuestions) {
      console.warn(`[checkMissingOfficialAnswers] Faltam questões no gabarito oficial!`);
      return { 
        missing: true, 
        found: officialAnswers?.length || 0, 
        expected: expectedQuestions 
      };
    }
    
    return { missing: false };
  } catch (error) {
    console.error('[checkMissingOfficialAnswers] Erro ao verificar gabarito:', error);
    return { 
      missing: true, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};
