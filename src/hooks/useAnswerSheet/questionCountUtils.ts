
import { Concurso, DisciplineBlock, NestedDiscipline } from '@/types/concursos';
import { getDisciplines, getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';
import { supabase } from '@/integrations/supabase/client';

// Função para obter o número total de questões de um concurso
export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Para concursos com disciplinas customizadas
    let totalQuestions = 0;
    
    // Verificar se temos estrutura hierárquica (blocos -> disciplinas)
    const isHierarchical = isHierarchicalStructure(concurso);
    
    if (isHierarchical) {
      // Estrutura hierárquica
      for (const block of concurso.disciplines) {
        if ('disciplines' in block) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              totalQuestions += getNumericValue(discipline.questionCount);
            }
          }
        }
      }
    } else {
      // Estrutura plana
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled) {
          totalQuestions += getNumericValue(discipline.questionCount);
        }
      }
    }
    
    return totalQuestions;
  } else {
    // Para estrutura tradicional
    return (
      (concurso.has_basic_knowledge ? getNumericValue(concurso.basic_knowledge_questions) : 0) +
      (concurso.has_specific_knowledge_1 ? getNumericValue(concurso.specific_knowledge_1_questions) : 0) +
      (concurso.has_specific_knowledge_2 ? getNumericValue(concurso.specific_knowledge_2_questions) : 0) +
      (concurso.has_specific_knowledge_3 ? getNumericValue(concurso.specific_knowledge_3_questions) : 0)
    );
  }
};

// Função para verificar se há gabaritos oficiais ausentes
export const checkMissingOfficialAnswers = async (concursoId: string): Promise<{
  missing: boolean;
  expected: number;
  actual: number;
}> => {
  try {
    // Buscar informações do concurso
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (concursoError || !concursoData) {
      console.error('Erro ao buscar dados do concurso:', concursoError);
      return { missing: true, expected: 0, actual: 0 };
    }

    // Calcular número esperado de questões
    const expectedQuestions = getTotalQuestions(concursoData);

    // Contar quantos gabaritos existem para este concurso
    const { data: gabaritosData, error: gabaritosError } = await supabase
      .from('official_answer_weights')
      .select('count', { count: 'exact', head: true })
      .eq('concurso_id', concursoId);

    if (gabaritosError) {
      console.error('Erro ao contar gabaritos oficiais:', gabaritosError);
      return { missing: true, expected: expectedQuestions, actual: 0 };
    }

    const actualQuestions = gabaritosData?.count || 0;

    console.log(`[checkMissingOfficialAnswers] Esperado: ${expectedQuestions}, Atual: ${actualQuestions}`);

    // Se o número atual de gabaritos for menor que o esperado, retornamos true para missing
    return {
      missing: actualQuestions < expectedQuestions,
      expected: expectedQuestions,
      actual: actualQuestions
    };
  } catch (error) {
    console.error('Erro ao verificar gabaritos oficiais:', error);
    return { missing: true, expected: 0, actual: 0 };
  }
};
