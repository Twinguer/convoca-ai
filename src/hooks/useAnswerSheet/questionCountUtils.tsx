import { Concurso } from '@/types/concursos';

// Calculate the total number of objective questions in the exam
export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  console.log('[getTotalQuestions] Calculando total de questões para concurso:', concurso.id);
  
  // If using custom knowledge structure
  if (concurso.has_custom_knowledge) {
    console.log('[getTotalQuestions] Usando estrutura de conhecimento customizado');
    let totalQuestions = 0;
    
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.questionCount) {
          const questionCount = typeof discipline.questionCount === 'number'
            ? discipline.questionCount
            : Number(String(discipline.questionCount || '0'));
            
          console.log(`[getTotalQuestions] Disciplina ${discipline.name}: ${questionCount} questões`);
          totalQuestions += questionCount;
        }
      });
    } else {
      console.warn('[getTotalQuestions] Nenhum array de disciplines encontrado para conhecimento customizado');
    }
    
    console.log(`[getTotalQuestions] Total de questões customizadas: ${totalQuestions}`);
    return totalQuestions;
  }
  
  // Traditional structure
  console.log('[getTotalQuestions] Usando estrutura tradicional');
  let total = 0;
  
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    const basicCount = typeof concurso.basic_knowledge_questions === 'number'
      ? concurso.basic_knowledge_questions
      : Number(String(concurso.basic_knowledge_questions || '0'));
      
    console.log(`[getTotalQuestions] Conhecimento básico: ${basicCount} questões`);
    total += basicCount;
  }
  
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    const count = typeof concurso.specific_knowledge_1_questions === 'number'
      ? concurso.specific_knowledge_1_questions
      : Number(String(concurso.specific_knowledge_1_questions || '0'));
      
    console.log(`[getTotalQuestions] Conhecimento específico 1: ${count} questões`);
    total += count;
  }
  
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    const count = typeof concurso.specific_knowledge_2_questions === 'number'
      ? concurso.specific_knowledge_2_questions
      : Number(String(concurso.specific_knowledge_2_questions || '0'));
      
    console.log(`[getTotalQuestions] Conhecimento específico 2: ${count} questões`);
    total += count;
  }
  
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    const count = typeof concurso.specific_knowledge_3_questions === 'number'
      ? concurso.specific_knowledge_3_questions
      : Number(String(concurso.specific_knowledge_3_questions || '0'));
      
    console.log(`[getTotalQuestions] Conhecimento específico 3: ${count} questões`);
    total += count;
  }
  
  console.log(`[getTotalQuestions] Total de questões tradicionais: ${total}`);
  return total;
};

// Get the count of questions that have been answered
export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  const count = Object.keys(answers).length;
  console.log(`[getAnsweredQuestionsCount] Total de respostas: ${count}`);
  return count;
};

// Nova função para verificar se existem questões nulas que não estão no gabarito
export const checkMissingOfficialAnswers = async (concursoId: string) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
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
