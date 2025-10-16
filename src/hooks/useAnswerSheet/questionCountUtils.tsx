
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
    console.log('[checkMissingOfficialAnswers] DEBUG - Parâmetros recebidos:', { concursoId, bookletId });
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', concursoId)
      .maybeSingle();

    console.log('[checkMissingOfficialAnswers] DEBUG - Resposta do Supabase:', { data, error });

    if (error || !data) {
      console.log('[checkMissingOfficialAnswers] Erro ao buscar gabarito oficial ou gabarito não encontrado');
      return true;
    }

    console.log('[checkMissingOfficialAnswers] DEBUG - official_answers encontrado:', data.official_answers);
    console.log('[checkMissingOfficialAnswers] DEBUG - Chaves disponíveis:', Object.keys(data.official_answers || {}));

    const bookletData = data?.official_answers?.[bookletId];
    console.log('[checkMissingOfficialAnswers] DEBUG - Dados do caderno:', bookletData);
    console.log('[checkMissingOfficialAnswers] DEBUG - bookletData.questions:', bookletData?.questions);
    console.log('[checkMissingOfficialAnswers] DEBUG - Quantidade de questões:', bookletData?.questions ? Object.keys(bookletData.questions).length : 0);
    
    
    if (!bookletData || !bookletData.questions) {
      console.log('[checkMissingOfficialAnswers] Gabarito não encontrado para o caderno:', bookletId);
      return true;
    }

    // Verificar se há pelo menos uma questão
    const questionCount = Object.keys(bookletData.questions).length;
    if (questionCount === 0) {
      console.log('[checkMissingOfficialAnswers] Gabarito encontrado mas sem questões');
      return true;
    }

    console.log('[checkMissingOfficialAnswers] Gabarito oficial encontrado com', questionCount, 'questões');
    return false;
  } catch (error) {
    console.error('[checkMissingOfficialAnswers] Erro ao verificar gabarito oficial:', error);
    return true;
  }
};
