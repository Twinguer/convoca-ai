
import { Concurso } from '@/types/concursos';

export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  let total = 0;
  
  // Add standard knowledge sections
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    total += concurso.basic_knowledge_questions;
  }
  
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    total += concurso.specific_knowledge_1_questions;
  }
  
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    total += concurso.specific_knowledge_2_questions;
  }
  
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    total += concurso.specific_knowledge_3_questions;
  }
  
  // Add disciplines questions
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    for (const discipline of concurso.disciplines) {
      if (discipline.questions) {
        total += discipline.questions;
      }
    }
  }
  
  return total;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  return Object.keys(answers).length;
};
