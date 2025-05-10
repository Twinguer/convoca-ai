
import { Concurso } from '@/types/concursos';

// Calculate the total number of objective questions in the exam
export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  // If using custom knowledge structure
  if (concurso.has_custom_knowledge) {
    let totalQuestions = 0;
    
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.questionCount) {
          totalQuestions += Number(discipline.questionCount);
        }
      });
    }
    
    return totalQuestions;
  }
  
  // Traditional structure
  let total = 0;
  
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    total += Number(concurso.basic_knowledge_questions);
  }
  
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    total += Number(concurso.specific_knowledge_1_questions);
  }
  
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    total += Number(concurso.specific_knowledge_2_questions);
  }
  
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    total += Number(concurso.specific_knowledge_3_questions);
  }
  
  return total;
};

// Get the count of questions that have been answered
export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  return Object.keys(answers).length;
};
