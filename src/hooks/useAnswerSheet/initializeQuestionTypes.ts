
import { Concurso } from '@/types/concursos';
import { getTotalQuestions } from './questionCountUtils';

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
  
  // Log removido por segurança
  return options;
};

// Re-export getTotalQuestions for convenience
export { getTotalQuestions } from './questionCountUtils';
