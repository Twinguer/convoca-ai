
import { Concurso } from '@/types/concursos';
import { getAllQuestionsForConcurso } from '@/integrations/supabase/rankings/examStructure';

export const getTotalQuestions = (concurso?: Concurso) => {
  if (!concurso) return 0;
  
  // Para concursos baseados em disciplinas
  if (concurso.minimum_score_type === 'subject') {
    // Usar a função getAllQuestionsForConcurso que lida corretamente com disciplinas
    return getAllQuestionsForConcurso(concurso).length;
  }
  
  // Para concursos baseados em conhecimentos
  let total = 0;
  
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
  
  return total;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }) => {
  return Object.keys(answers).length;
};
