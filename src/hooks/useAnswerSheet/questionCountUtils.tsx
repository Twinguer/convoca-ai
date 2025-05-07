
import { Concurso } from '@/types/concursos';
import { getAllQuestionsForConcurso } from '@/integrations/supabase/rankings/examStructure';

export const getTotalQuestions = (concurso?: Concurso) => {
  if (!concurso) return 0;
  
  // Para concursos baseados em disciplinas ou conhecimentos, usamos a mesma função
  return getAllQuestionsForConcurso(concurso).length;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }) => {
  return Object.keys(answers).length;
};
