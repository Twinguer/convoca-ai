
import { Concurso } from '@/types/concursos';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3'>>
) => {
  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
  } else if (concurso.has_discursive) {
    setSelectedSection('discursive');
  } else if (concurso.has_case_study_1) {
    setSelectedSection('case_study1');
  } else if (concurso.has_case_study_2) {
    setSelectedSection('case_study2');
  } else if (concurso.has_case_study_3) {
    setSelectedSection('case_study3');
  }
};

// Função para obter o nome formatado da seção para exibição
export const getSectionDisplayName = (section: 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3'): string => {
  const displayNames: Record<string, string> = {
    basic: 'Conhecimentos Básicos',
    specific1: 'Conhecimentos Específicos 1',
    specific2: 'Conhecimentos Específicos 2',
    specific3: 'Conhecimentos Específicos 3',
    discursive: 'Prova Discursiva',
    case_study1: 'Estudo de Caso 1',
    case_study2: 'Estudo de Caso 2',
    case_study3: 'Estudo de Caso 3'
  };
  
  return displayNames[section] || section;
};
