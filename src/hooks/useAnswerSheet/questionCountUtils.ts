
import { Concurso } from '@/types/concursos';
import { getDisciplines, getNumericValue } from '@/integrations/supabase/rankings/examStructure';
import { supabase } from '@/integrations/supabase/client';

export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  let total = 0;
  
  // Contar questões de todas as disciplinas habilitadas
  const disciplines = getDisciplines(concurso);
  if (Array.isArray(disciplines)) {
    disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.questionCount) {
        total += getNumericValue(discipline.questionCount);
      }
    });
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
