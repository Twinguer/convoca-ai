
import { Concurso } from '@/types/concursos';

export const createQuestionOptions = (concurso: Concurso): Record<number, string[]> => {
  const options: Record<number, string[]> = {};
  
  // Determine question type based on exam
  const questionOptions = concurso.exam_type === 'Certo ou Errado' 
    ? ['C', 'E'] 
    : ['A', 'B', 'C', 'D', 'E'];
  
  // Calculate total questions and create options
  const totalQuestions = getTotalQuestions(concurso);
  
  for (let i = 1; i <= totalQuestions; i++) {
    options[i] = questionOptions;
  }
  
  console.log(`[createQuestionOptions] Created options for ${totalQuestions} questions with ${questionOptions.length} choices each`);
  return options;
};

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
