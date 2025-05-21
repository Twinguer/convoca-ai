import { Concurso } from '@/types/concursos';
import { getDisciplines, getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';
import { supabase } from '@/integrations/supabase/client';

export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;

  let total = 0;

  // Verificar se estamos usando conhecimentos customizáveis
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso); // Supondo que isHierarchicalStructure é definida e funciona

    console.log(`[getTotalQuestions] Using hierarchical structure: ${hierarchical}`);

    if (hierarchical) {
      // Contar em estrutura hierárquica
      for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto para compatibilidade com dados, idealmente remover após refatoração completa
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              total += getNumericValue(discipline.questionCount);
            }
          }
        }
      }
      console.log(`[getTotalQuestions] Total hierarchical questions: ${total}`);
      return total;
    }

    // Contar em estrutura plana (ajustado para iterar sobre blocos e disciplinas aninhadas)
    for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto para compatibilidade com dados
      if (block.disciplines && Array.isArray(block.disciplines)) {
        for (const discipline of block.disciplines) {
          if (discipline.isEnabled) {
            total += getNumericValue(discipline.questionCount);
          }
        }
      }
    }
    console.log(`[getTotalQuestions] Total flat questions (adjusted): ${total}`); // Log ajustado
    return total;
  }

  // Estrutura tradicional (legacy) - Manter por retrocompatibilidade
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

  console.log(`[getTotalQuestions] Total traditional questions: ${total}`); // Log para estrutura tradicional
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
