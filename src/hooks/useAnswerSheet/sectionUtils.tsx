
import { Concurso } from '@/types/concursos';

// Define disciplinas com nomes e siglas
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

// Define o tipo para seções que inclui conhecimentos, disciplinas e avaliações discursivas
type QuestionSectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive'
  | 'case_study1' 
  | 'case_study2'
  | 'case_study3'
  // Disciplinas comuns
  | 'LPT' | 'ING' | 'MAT' | 'RLM' | 'EST' | 'COS' | 'ADM' | 'ADO' 
  | 'COT' | 'COC' | 'ECO' | 'TRI' | 'AFO' | 'LTC' | 'TIC' | 'ETT' 
  | 'AUD' | 'CIV' | 'PEN' | 'INF' | 'EMP' | 'MTF' | 'OUT'
  // Permite qualquer string para disciplinas customizadas
  | string;

// Gera uma sigla única para disciplinas customizadas
export const generateCustomDisciplineSigla = () => {
  const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `C${randomChars}`;
};

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<QuestionSectionType>>
) => {
  // Verifica todas as seções possíveis em ordem de prioridade
  // Conhecimentos e disciplinas são tratados como parte da mesma lista

  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
  } else if (concurso.disciplines && concurso.disciplines.length > 0) {
    // Se não há conhecimentos, mas há disciplinas, seleciona a primeira disciplina
    setSelectedSection(concurso.disciplines[0].sigla);
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

// Helper function para obter uma disciplina pela sigla
export const getDisciplineBySigla = (concurso: Concurso, sigla: string) => {
  if (!concurso.disciplines) return null;
  
  return concurso.disciplines.find(
    (discipline: any) => discipline.sigla === sigla
  );
};

// Helper function para obter todas as disciplinas
export const getDisciplines = (concurso: Concurso) => {
  return concurso.disciplines || [];
};

// Helper function para verificar se uma seção é uma disciplina
export const isDisciplineSection = (sigla: string, concurso: Concurso) => {
  if (!concurso.disciplines) return false;
  
  return concurso.disciplines.some(
    (discipline: any) => discipline.sigla === sigla
  );
};

// Helper function para obter todas as seções disponíveis (conhecimentos + disciplinas)
export const getAllSections = (concurso: Concurso) => {
  const sections: {key: string, label: string, weight?: number}[] = [];
  
  // Adiciona conhecimentos
  if (concurso.has_basic_knowledge) {
    sections.push({ key: 'basic', label: 'Conhecimentos Básicos', weight: concurso.basic_knowledge_weight });
  }
  
  if (concurso.has_specific_knowledge_1) {
    sections.push({ key: 'specific1', label: 'C. Específicos 1', weight: concurso.specific_knowledge_1_weight });
  }
  
  if (concurso.has_specific_knowledge_2) {
    sections.push({ key: 'specific2', label: 'C. Específicos 2', weight: concurso.specific_knowledge_2_weight });
  }
  
  if (concurso.has_specific_knowledge_3) {
    sections.push({ key: 'specific3', label: 'C. Específicos 3', weight: concurso.specific_knowledge_3_weight });
  }
  
  // Adiciona disciplinas na mesma lista
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      sections.push({ 
        key: discipline.sigla, 
        label: discipline.name,
        weight: discipline.weight 
      });
    });
  }
  
  // Adiciona avaliações discursivas
  if (concurso.has_discursive) {
    sections.push({ key: 'discursive', label: 'Discursiva', weight: concurso.discursive_weight });
  }
  
  if (concurso.has_case_study_1) {
    sections.push({ key: 'case_study1', label: 'Estudo de Caso 1', weight: concurso.case_study_1_weight });
  }
  
  if (concurso.has_case_study_2) {
    sections.push({ key: 'case_study2', label: 'Estudo de Caso 2', weight: concurso.case_study_2_weight });
  }
  
  if (concurso.has_case_study_3) {
    sections.push({ key: 'case_study3', label: 'Estudo de Caso 3', weight: concurso.case_study_3_weight });
  }
  
  return sections;
};
