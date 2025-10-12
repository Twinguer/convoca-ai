
import { Concurso } from '@/types/concursos';

// Calculate the total number of objective questions in the exam
export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  console.log('[getTotalQuestions] Calculando total de questões para concurso:', concurso.id);
  
  // Always use disciplines structure (new system)
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    console.log('[getTotalQuestions] Usando estrutura de disciplinas');
    let totalQuestions = 0;
    
    // Check if hierarchical structure (blocks -> disciplines)
    const isHierarchical = concurso.disciplines.length > 0 && 
                          concurso.disciplines[0] && 
                          typeof concurso.disciplines[0] === 'object' && 
                          'name' in concurso.disciplines[0] && 
                          'disciplines' in concurso.disciplines[0];
    
    if (isHierarchical) {
      // Process hierarchical structure
      for (const block of concurso.disciplines) {
        if ('disciplines' in block && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.questionCount) {
              const questionCount = typeof discipline.questionCount === 'number'
                ? discipline.questionCount
                : Number(String(discipline.questionCount || '0'));
                
              console.log(`[getTotalQuestions] Disciplina ${discipline.name}: ${questionCount} questões`);
              totalQuestions += questionCount;
            }
          }
        }
      }
    } else {
      // Process flat structure
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.questionCount) {
          const questionCount = typeof discipline.questionCount === 'number'
            ? discipline.questionCount
            : Number(String(discipline.questionCount || '0'));
            
          console.log(`[getTotalQuestions] Disciplina ${discipline.name}: ${questionCount} questões`);
          totalQuestions += questionCount;
        }
      });
    }
    
    console.log(`[getTotalQuestions] Total de questões: ${totalQuestions}`);
    return totalQuestions;
  }
  
  console.warn('[getTotalQuestions] No disciplines found, returning 0');
  return 0;
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
      .from('concursos')
      .select('official_answers')
      .eq('id', concursoId)
      .maybeSingle();

    if (error || !data) {
      console.log('[checkMissingOfficialAnswers] Erro ao buscar gabarito oficial ou gabarito não encontrado');
      return true;
    }

    const bookletData = data?.official_answers?.[bookletId];
    if (!bookletData || !bookletData.questions) {
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
