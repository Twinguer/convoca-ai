
import { Concurso } from '@/types/concursos';
import { getEnabledKnowledgeAreas } from '@/services/knowledgeAreaService';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: string) => void
) => {
  // Obter todas as áreas de conhecimento habilitadas
  const enabledAreas = getEnabledKnowledgeAreas(concurso);
  
  // Se houver alguma área habilitada, selecione a primeira
  if (enabledAreas.length > 0) {
    setSelectedSection(enabledAreas[0].key);
    return;
  }
  
  // Caso não haja áreas habilitadas, verificar discursivas
  if (concurso.has_discursive) {
    setSelectedSection('discursive');
    return;
  } else if (concurso.has_case_study_1) {
    setSelectedSection('case_study1');
    return;
  } else if (concurso.has_case_study_2) {
    setSelectedSection('case_study2');
    return;
  } else if (concurso.has_case_study_3) {
    setSelectedSection('case_study3');
    return;
  }
  
  // Padrão caso não haja nenhuma seção disponível
  setSelectedSection('basic');
};
