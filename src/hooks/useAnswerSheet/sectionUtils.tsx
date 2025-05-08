
import { Concurso } from '@/types/concursos';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<string>>
) => {
  // Verificar conhecimentos tradicionais primeiro
  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
    return;
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
    return;
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
    return;
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
    return;
  } 
  
  // Verificar novas áreas de conhecimento
  const knowledgeAreas = [
    'lpt', 'ing', 'mat', 'rlm', 'est', 'cos', 'adm', 'ado',
    'cot', 'coc', 'eco', 'tri', 'afo', 'ltc', 'tic', 'ett',
    'aud', 'civ', 'pen', 'inf', 'emp', 'mtf', 'out'
  ];
  
  for (const area of knowledgeAreas) {
    const hasKey = `has_${area}` as keyof Concurso;
    if (concurso[hasKey]) {
      setSelectedSection(area.toUpperCase());
      return;
    }
  }
  
  // Verificar seções discursivas
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
