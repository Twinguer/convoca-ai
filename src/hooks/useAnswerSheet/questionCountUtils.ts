
import { Concurso } from '@/types/concursos';
import { getDisciplines, getNumericValue } from '@/integrations/supabase/rankings/examStructure';

export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  let total = 0;
  
  // Contar questões de todas as disciplinas habilitadas
  const disciplines = getDisciplines(concurso);
  if (Array.isArray(disciplines)) {
    disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.questionCount) {
        total += getNumericValue(discipline.questionCount);
      }
    });
  }
  
  return total;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  return Object.keys(answers).length;
};
