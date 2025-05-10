
import { Concurso } from '@/types/concursos';

// Calculate the total number of objective questions in the exam
export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  // If using custom knowledge structure
  if (concurso.has_custom_knowledge) {
    console.log('Getting total questions for custom knowledge structure');
    let totalQuestions = 0;
    
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.questionCount) {
          const questionCount = typeof discipline.questionCount === 'number'
            ? discipline.questionCount
            : Number(discipline.questionCount);
            
          console.log(`Discipline ${discipline.name}: ${questionCount} questions`);
          totalQuestions += questionCount;
        }
      });
    } else {
      console.warn('No disciplines array found for custom knowledge');
    }
    
    console.log(`Total custom questions: ${totalQuestions}`);
    return totalQuestions;
  }
  
  // Traditional structure
  console.log('Getting total questions for traditional structure');
  let total = 0;
  
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    const basicCount = typeof concurso.basic_knowledge_questions === 'number'
      ? concurso.basic_knowledge_questions
      : Number(concurso.basic_knowledge_questions);
      
    console.log(`Basic knowledge: ${basicCount} questions`);
    total += basicCount;
  }
  
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    const count = typeof concurso.specific_knowledge_1_questions === 'number'
      ? concurso.specific_knowledge_1_questions
      : Number(concurso.specific_knowledge_1_questions);
      
    console.log(`Specific knowledge 1: ${count} questions`);
    total += count;
  }
  
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    const count = typeof concurso.specific_knowledge_2_questions === 'number'
      ? concurso.specific_knowledge_2_questions
      : Number(concurso.specific_knowledge_2_questions);
      
    console.log(`Specific knowledge 2: ${count} questions`);
    total += count;
  }
  
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    const count = typeof concurso.specific_knowledge_3_questions === 'number'
      ? concurso.specific_knowledge_3_questions
      : Number(concurso.specific_knowledge_3_questions);
      
    console.log(`Specific knowledge 3: ${count} questions`);
    total += count;
  }
  
  console.log(`Total traditional questions: ${total}`);
  return total;
};

// Get the count of questions that have been answered
export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  return Object.keys(answers).length;
};
