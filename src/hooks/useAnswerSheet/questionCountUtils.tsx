
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

// Check if official answers are missing for a given concurso and booklet
export const checkMissingOfficialAnswers = async (concursoId: string, bookletId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .maybeSingle();

    if (error || !data) {
      console.log('[checkMissingOfficialAnswers] Erro ao buscar gabarito oficial ou gabarito não encontrado');
      return true;
    }

    const bookletData = data?.consolidated_answer_data?.booklets?.[bookletId];
    if (!bookletData || !bookletData.answers) {
      console.log('[checkMissingOfficialAnswers] Gabarito não encontrado para o caderno:', bookletId);
      return true;
    }

    console.log('[checkMissingOfficialAnswers] Gabarito oficial encontrado');
    return false;
  } catch (error) {
    console.error('[checkMissingOfficialAnswers] Erro ao verificar gabarito oficial:', error);
    return true;
  }
};
