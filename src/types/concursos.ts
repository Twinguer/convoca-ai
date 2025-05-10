export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  data_publicacao: string | null;
  etapa_atual?: string;
  created_at: string;
  updated_at: string;
  link?: string | null;
  inscritos?: number | null;
  vagas?: number | null;
  knowledgeAreas?: string[] | null;
  localidades?: string[] | null;
  status: string;
  custom_banca?: string | null;
  is_admin_created?: boolean;
  created_by_user_id?: string | null;
  
  // Configuração de conhecimentos customizáveis
  has_custom_knowledge?: boolean;
  
  // Exam structure configuration
  has_basic_knowledge?: boolean;
  has_specific_knowledge_1?: boolean;
  has_specific_knowledge_2?: boolean;
  has_specific_knowledge_3?: boolean;
  has_discursive?: boolean;
  has_case_study_1?: boolean;
  has_case_study_2?: boolean;
  has_case_study_3?: boolean;
  
  // Question counts - updated to ensure numeric types
  basic_knowledge_questions?: number;
  specific_knowledge_1_questions?: number;
  specific_knowledge_2_questions?: number;
  specific_knowledge_3_questions?: number;
  custom_knowledge_questions?: number;
  
  // Section weights
  basic_knowledge_weight?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_3_weight?: number;
  discursive_weight?: number;
  case_study_1_weight?: number;
  case_study_2_weight?: number;
  case_study_3_weight?: number;
  custom_knowledge_weight?: number;
  
  // Exam configuration
  alternatives_count?: number;
  wrong_answer_penalty?: number;
  exam_type?: string;
  
  // Predefined job information
  predefined_job_title?: string | null;
  custom_job_title?: string | null;
  
  // Reservation types
  has_ampla_concorrencia?: boolean;
  has_ppp?: boolean;
  has_pcd?: boolean;
  has_hipossuficientes?: boolean;
  has_indigenas?: boolean;
  has_transsexuais?: boolean;
  
  // Admin flag
  is_admin_update?: boolean;
  
  // Disciplines array for custom knowledge structure
  disciplines?: Array<{
    id?: string;
    type: string;
    name: string;
    isEnabled: boolean;
    questionCount?: number;
    weight?: number;
  }>;
}

export interface ConcursoFilter {
  status?: string;
  orgao?: string;
  banca?: string;
}

export interface UserRankingDisplay {
  concursoId: string;
  concursoTitle: string;
  position: number;
  score: number;
  basic_knowledge_score?: number;
  specific_knowledge_score?: number;
  discursive_score?: number;
  rankingId?: string;
}

export interface RankingTableColumn {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

// SectionType atualizado para aceitar qualquer string
export type SectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive' 
  | 'case_study1' 
  | 'case_study2' 
  | 'case_study3'
  | string; // Permite tipos customizados para disciplinas

// Fixed helper to determine which specific knowledge sections are enabled
export const getEnabledKnowledgeSections = (concurso: Concurso) => {
  const useCustomKnowledge = concurso.has_custom_knowledge === true;
  
  // Estrutura base com seções tradicionais
  const enabledSections: Record<string, boolean> = {
    basicKnowledge: concurso.has_basic_knowledge === true,
    specificKnowledge1: concurso.has_specific_knowledge_1 === true,
    specificKnowledge2: concurso.has_specific_knowledge_2 === true,
    specificKnowledge3: concurso.has_specific_knowledge_3 === true,
    discursive: concurso.has_discursive === true,
    caseStudy1: concurso.has_case_study_1 === true,
    caseStudy2: concurso.has_case_study_2 === true,
    caseStudy3: concurso.has_case_study_3 === true,
    useCustomKnowledge: useCustomKnowledge
  };
  
  // Adicionar seções customizadas se estiverem sendo usadas
  if (useCustomKnowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.type) {
        enabledSections[discipline.type] = true;
      }
    });
  }
  
  return enabledSections;
};

// Function to get the table columns for a ranking based on the concurso structure
export const getRankingTableColumns = (concurso: Concurso) => {
  const columns = [
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ];
  
  // Verificar se estamos usando a estrutura customizada
  const useCustomKnowledge = concurso.has_custom_knowledge === true;
  
  if (useCustomKnowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Adicionar colunas baseadas nas disciplinas customizadas
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled) {
        columns.push({
          id: `${discipline.type}Score`,
          label: discipline.name,
          align: 'right'
        });
      }
    });
  } else {
    // Add columns based on enabled sections (traditional structure)
    if (concurso.has_basic_knowledge) {
      columns.push({ id: 'basicScore', label: 'Básica', align: 'right' });
    }
    
    if (concurso.has_specific_knowledge_1) {
      columns.push({ id: 'specific1Score', label: 'Específica 1', align: 'right' });
    }
    
    if (concurso.has_specific_knowledge_2) {
      columns.push({ id: 'specific2Score', label: 'Específica 2', align: 'right' });
    }
    
    if (concurso.has_specific_knowledge_3) {
      columns.push({ id: 'specific3Score', label: 'Específica 3', align: 'right' });
    }
  }
  
  if (concurso.has_discursive) {
    columns.push({ id: 'discursiveScore', label: 'Discursiva', align: 'right' });
  }
  
  if (concurso.has_case_study_1) {
    columns.push({ id: 'case1Score', label: 'Estudo 1', align: 'right' });
  }
  
  if (concurso.has_case_study_2) {
    columns.push({ id: 'case2Score', label: 'Estudo 2', align: 'right' });
  }
  
  if (concurso.has_case_study_3) {
    columns.push({ id: 'case3Score', label: 'Estudo 3', align: 'right' });
  }
  
  return columns;
};
