
import { Concurso } from '@/types/concursos';

// Define disciplines with names and siglas
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
  { name: 'Outro', sigla: 'OUT' }
];

// Generate a unique sigla for custom disciplines
export const generateCustomDisciplineSigla = () => {
  const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `C${randomChars}`;
};

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3' | string>>
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
  } else if (concurso.disciplines && concurso.disciplines.length > 0) {
    // If there are disciplines but no standard sections, select the first discipline
    setSelectedSection(concurso.disciplines[0].sigla);
  }
};

// Helper function to get discipline by sigla
export const getDisciplineBySigla = (concurso: Concurso, sigla: string) => {
  if (!concurso.disciplines) return null;
  
  return concurso.disciplines.find(
    (discipline: any) => discipline.sigla === sigla
  );
};

// Helper function to get all disciplines
export const getDisciplines = (concurso: Concurso) => {
  return concurso.disciplines || [];
};
