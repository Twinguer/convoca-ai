
import { Concurso } from '@/types/concursos';
import { getEnabledKnowledgeAreas, KnowledgeArea } from '@/services/knowledgeAreaService';

/**
 * Calcula a estrutura (faixas) do exame com base nas configurações do concurso
 */
export const getExamStructure = (concurso: any) => {
  // Obter todas as áreas de conhecimento habilitadas em ordem
  const enabledAreas = getEnabledKnowledgeAreas(concurso);
  
  // Mapear faixas de questões para cada área
  let currentEnd = 0;
  const areaEnds: Record<string, number> = {};
  
  // Para cada área habilitada, calcular o final da faixa
  for (const area of enabledAreas) {
    // Pular áreas sem questões como discursivas
    if (!area.questionsField) continue;
    
    // Obter o número de questões para esta área
    const questionCount = concurso[area.questionsField as keyof Concurso] as number || 0;
    
    if (questionCount > 0) {
      // Atualizar o contador de questões
      currentEnd += questionCount;
      
      // Armazenar o final desta área
      const areaEndKey = `${area.key}End`;
      areaEnds[areaEndKey] = currentEnd;
    }
  }
  
  // Retornar todos os finais de área e o total de questões
  return {
    ...areaEnds,
    totalQuestions: currentEnd
  };
};
