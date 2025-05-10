
/**
 * Calcula a estrutura (faixas) do exame com base nas configurações do concurso
 */
export const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    totalQuestions: specific3End
  };
};

// Add the missing exports that were causing build errors
export type SectionType = 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3';

export const sectionDisplayNames: Record<SectionType, string> = {
  basic: 'Conhecimentos Básicos',
  specific1: 'Conhecimentos Específicos 1',
  specific2: 'Conhecimentos Específicos 2',
  specific3: 'Conhecimentos Específicos 3',
  discursive: 'Discursiva',
  case_study1: 'Estudo de Caso 1',
  case_study2: 'Estudo de Caso 2',
  case_study3: 'Estudo de Caso 3'
};

export const updateSectionDisplayNames = (customNames: Record<string, string>) => {
  // This is a placeholder function that would allow customizing section names
  return {
    ...sectionDisplayNames,
    ...customNames
  };
};

export const getSectionTypeForQuestion = (questionNumber: number, concurso: any): SectionType => {
  const { basicEnd, specific1End, specific2End } = getExamStructure(concurso);
  
  if (questionNumber <= basicEnd) return 'basic';
  if (questionNumber <= specific1End) return 'specific1';
  if (questionNumber <= specific2End) return 'specific2';
  return 'specific3';
};
