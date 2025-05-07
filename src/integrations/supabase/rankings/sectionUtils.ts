
// Export all functions from the sub-modules
export const DISCIPLINES = [
  { name: 'Português', sigla: 'LPT' },
  { name: 'Inglês', sigla: 'ING' },
  { name: 'Matemática', sigla: 'MAT' },
  { name: 'RLM', sigla: 'RLM' },
  { name: 'Estatística', sigla: 'EST' },
  { name: 'Constitucional', sigla: 'COS' },
  { name: 'Administrativo', sigla: 'ADM' },
  { name: 'Administração', sigla: 'ADO' },
  { name: 'Contabilidade', sigla: 'COT' },
  { name: 'Contabilidade Custos', sigla: 'COC' },
  { name: 'Economia', sigla: 'ECO' },
  { name: 'Tributário', sigla: 'TRI' },
  { name: 'AFO', sigla: 'AFO' },
  { name: 'Legislação Tributária', sigla: 'LTC' },
  { name: 'Tecnologia da informação', sigla: 'TIC' },
  { name: 'Estatuto', sigla: 'ETT' },
  { name: 'Auditoria', sigla: 'AUD' },
  { name: 'Civil', sigla: 'CIV' },
  { name: 'Penal', sigla: 'PEN' },
  { name: 'Informática', sigla: 'INF' },
  { name: 'Empresarial', sigla: 'EMP' },
  { name: 'Mat. Financeira', sigla: 'MTF' },
  { name: 'Outro...', sigla: 'OUT' },
];

// Types for section management
export enum SectionType {
  BASIC = 'basic',
  SPECIFIC1 = 'specific1',
  SPECIFIC2 = 'specific2',
  SPECIFIC3 = 'specific3',
  DISCURSIVE = 'discursive',
  CASE_STUDY1 = 'case_study1',
  CASE_STUDY2 = 'case_study2',
  CASE_STUDY3 = 'case_study3',
  DISCIPLINE = 'discipline',
}

export interface Discipline {
  name: string;
  sigla: string;
}

export const handleQuestionSectionSelection = (
  concurso: any,
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
