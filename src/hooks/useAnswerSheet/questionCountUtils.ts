
import { supabase } from '@/integrations/supabase/client';
import { getConsolidatedAnswerKey } from '@/services/answerKeyService';
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

export const checkMissingOfficialAnswers = async (concursoId: string) => {
  try {
    console.log('[checkMissingOfficialAnswers] Checking for concurso:', concursoId);
    
    // Buscar informações do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (concursoError || !concurso) {
      console.error('[checkMissingOfficialAnswers] Erro ao buscar concurso:', concursoError);
      return { missing: true, reason: 'Concurso não encontrado' };
    }

    // Calcular total de questões esperadas usando a função correta
    const totalExpectedQuestions = getTotalQuestions(concurso);

    console.log('[checkMissingOfficialAnswers] Total esperado de questões:', totalExpectedQuestions);

    if (totalExpectedQuestions === 0) {
      return { missing: true, reason: 'Nenhuma questão configurada no concurso' };
    }

    // Buscar gabarito consolidado usando a nova estrutura JSON
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData || !consolidatedData.booklets) {
      console.log('[checkMissingOfficialAnswers] Nenhum gabarito consolidado encontrado');
      return { missing: true, reason: 'Gabarito oficial não encontrado' };
    }

    // Verificar se há pelo menos um caderno com questões suficientes
    let hasCompleteBooklet = false;
    
    Object.entries(consolidatedData.booklets).forEach(([bookletId, bookletData]: [string, any]) => {
      const answersCount = Object.keys(bookletData.answers || {}).length;
      console.log(`[checkMissingOfficialAnswers] Caderno ${bookletId}: ${answersCount} respostas`);
      
      if (answersCount >= totalExpectedQuestions) {
        hasCompleteBooklet = true;
      }
    });

    if (!hasCompleteBooklet) {
      return { 
        missing: true, 
        reason: `Gabarito incompleto. Esperado: ${totalExpectedQuestions} questões por caderno` 
      };
    }

    console.log('[checkMissingOfficialAnswers] Gabarito oficial completo encontrado');
    return { missing: false };

  } catch (error) {
    console.error('[checkMissingOfficialAnswers] Erro:', error);
    return { missing: true, reason: 'Erro ao verificar gabarito oficial' };
  }
};
