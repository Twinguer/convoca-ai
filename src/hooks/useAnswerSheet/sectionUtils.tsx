
import { Concurso, SectionType } from '@/types/concursos';

// Export a handler for selecting which section to show initially
export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSection: (section: SectionType) => void
) => {
  // Prioridade de seleção de seção
  if (concurso.has_basic_knowledge) {
    setSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    setSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    setSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    setSection('specific3');
  } else if (concurso.has_discursive) {
    setSection('discursive');
  } else if (concurso.has_case_study_1) {
    setSection('case_study1');
  } else if (concurso.has_case_study_2) {
    setSection('case_study2');
  } else if (concurso.has_case_study_3) {
    setSection('case_study3');
  } else {
    // Default fallback
    setSection('basic');
  }
};

/**
 * Obtém uma array com todas as seções ativas no concurso
 */
export const getAllEnabledSections = (concurso: Concurso): SectionType[] => {
  const enabledSections: SectionType[] = [];
  
  // Adicionar seções padrão se estiverem ativas
  if (concurso.has_basic_knowledge) enabledSections.push('basic');
  if (concurso.has_specific_knowledge_1) enabledSections.push('specific1');
  if (concurso.has_specific_knowledge_2) enabledSections.push('specific2');
  if (concurso.has_specific_knowledge_3) enabledSections.push('specific3');
  if (concurso.has_discursive) enabledSections.push('discursive');
  if (concurso.has_case_study_1) enabledSections.push('case_study1');
  if (concurso.has_case_study_2) enabledSections.push('case_study2');
  if (concurso.has_case_study_3) enabledSections.push('case_study3');
  
  return enabledSections;
};

/**
 * Verifica se uma string representa um tipo de seção válido
 */
export const isValidSectionType = (sectionType: string): boolean => {
  const standardSections: SectionType[] = [
    'basic', 'specific1', 'specific2', 'specific3', 
    'discursive', 'case_study1', 'case_study2', 'case_study3'
  ];
  
  return standardSections.includes(sectionType as SectionType);
};

/**
 * Obtém o nome de exibição para uma seção
 */
export const getSectionDisplayName = (sectionType: SectionType): string => {
  // Seções padrão
  switch (sectionType) {
    case 'basic': return 'Conhecimentos Básicos';
    case 'specific1': return 'Conhecimentos Específicos';
    case 'specific2': return 'Conhecimentos Específicos 2';
    case 'specific3': return 'Conhecimentos Específicos 3';
    case 'discursive': return 'Dissertativa';
    case 'case_study1': return 'Estudo de Caso';
    case 'case_study2': return 'Estudo de Caso 2';
    case 'case_study3': return 'Estudo de Caso 3';
    default: return sectionType;
  }
};
