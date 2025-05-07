
import { Concurso } from '@/types/concursos';
import { getAllQuestionsForConcurso } from '@/integrations/supabase/rankings/examStructure';

// Função simplificada que funciona para ambos os tipos de concurso
export const getTotalQuestions = (concurso?: Concurso) => {
  if (!concurso) return 0;
  return getAllQuestionsForConcurso(concurso).length;
};

// Contador de respostas respondidas
export const getAnsweredQuestionsCount = (answers: { [key: number]: string }) => {
  return Object.keys(answers).length;
};
