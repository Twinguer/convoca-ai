export interface AnswerKey {
  id: string;
  concurso_id: string;
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
  is_specific_1: boolean;
  is_specific_2: boolean;
  is_specific_3?: boolean;
  is_nullified?: boolean; // Field for nullified questions
}

export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  etapa_atual?: string;
  status: string;
  vagas?: number;
  inscritos?: number;
  data_publicacao?: string;
  link?: string;
  created_at: string;
  updated_at: string;
  alternatives_count?: number;
  exam_type?: string;
  
  // Knowledge areas configuration
  has_basic_knowledge?: boolean;
  has_specific_knowledge_1?: boolean;
  has_specific_knowledge_2?: boolean;
  has_specific_knowledge_3?: boolean;
  has_discursive?: boolean;
  has_case_study_1?: boolean;
  has_case_study_2?: boolean;
  has_case_study_3?: boolean;
  
  // Question counts
  basic_knowledge_questions?: number;
  specific_knowledge_1_questions?: number;
  specific_knowledge_2_questions?: number;
  specific_knowledge_3_questions?: number;
  
  // Weights
  basic_knowledge_weight?: number;
  specific_knowledge_weight?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_3_weight?: number;
  discursive_weight?: number;
  case_study_1_weight?: number;
  case_study_2_weight?: number;
  case_study_3_weight?: number;
  
  // Wrong answer penalty (for certain exam types)
  wrong_answer_penalty?: number;
  
  // Quota types
  has_ampla_concorrencia?: boolean;
  has_ppp?: boolean;
  has_pcd?: boolean;
  has_hipossuficientes?: boolean;
  has_indigenas?: boolean;
  has_transsexuais?: boolean;
  
  // Other fields
  custom_banca?: string;
  custom_job_title?: string;
  predefined_job_title?: string;
  localidades?: string[];
  
  created_by_user_id?: string;
  is_admin_created?: boolean;
}

export interface ConcursoFilter {
  search?: string;
  banca?: string;
  status?: string;
  periodo?: string;
}

export interface UserRankingDisplay {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  score: number;
  basic_knowledge_score?: number;
  specific_knowledge_score?: number;
  specific_knowledge_1_score?: number;
  specific_knowledge_2_score?: number;
  specific_knowledge_3_score?: number;
  discursive_score?: number;
  case_study_1_score?: number;
  case_study_2_score?: number;
  case_study_3_score?: number;
  position: number;
  concurso_id: string;
  concurso_title: string;
  concurso_orgao: string;
  created_at: string;
}

// Interface for table column configuration
interface TableColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

// Function to generate dynamic table columns based on the concurso structure
export function getRankingTableColumns(concurso: Concurso): TableColumn[] {
  // Start with the mandatory columns
  const columns: TableColumn[] = [
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato' },
    { id: 'score', label: 'Total', align: 'right' }
  ];
  
  // Add dynamic columns based on concurso configuration
  if (concurso.has_basic_knowledge !== false) {
    columns.push({ 
      id: 'basic', 
      label: 'Conhec. Básicos', 
      align: 'right' 
    });
  }
  
  if (concurso.has_specific_knowledge_1 !== false) {
    columns.push({ 
      id: 'specific1', 
      label: 'Conhec. Específicos', 
      align: 'right' 
    });
  }
  
  if (concurso.has_specific_knowledge_2 === true) {
    columns.push({ 
      id: 'specific2', 
      label: 'C. Específicos 2', 
      align: 'right' 
    });
  }
  
  if (concurso.has_specific_knowledge_3 === true) {
    columns.push({ 
      id: 'specific3', 
      label: 'C. Específicos 3', 
      align: 'right' 
    });
  }
  
  if (concurso.has_discursive === true) {
    columns.push({ 
      id: 'discursive', 
      label: 'Discursiva', 
      align: 'right' 
    });
  }
  
  if (concurso.has_case_study_1 === true) {
    columns.push({ 
      id: 'case_study1', 
      label: 'Estudo de Caso 1', 
      align: 'right' 
    });
  }
  
  if (concurso.has_case_study_2 === true) {
    columns.push({ 
      id: 'case_study2', 
      label: 'Estudo de Caso 2', 
      align: 'right' 
    });
  }
  
  if (concurso.has_case_study_3 === true) {
    columns.push({ 
      id: 'case_study3', 
      label: 'Estudo de Caso 3', 
      align: 'right' 
    });
  }
  
  return columns;
}
