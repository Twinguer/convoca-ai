
import { Concurso } from '@/types/concursos';
import { getEnabledKnowledgeAreas } from '@/services/knowledgeAreaService';

export const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  // Utiliza a função getEnabledKnowledgeAreas para obter todas as áreas habilitadas
  const enabledAreas = getEnabledKnowledgeAreas(concurso);
  
  // Conta o total de questões somando o número de questões de cada área habilitada
  let totalQuestions = 0;
  for (const area of enabledAreas) {
    // Só considera áreas que têm questões (ignora discursivas por exemplo)
    if (area.questionsField) {
      const questionCount = concurso[area.questionsField as keyof Concurso] as number;
      totalQuestions += questionCount || 0;
    }
  }
  
  return totalQuestions;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }): number => {
  return Object.keys(answers).length;
};
