
export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  custom_banca?: string;
  vagas: number;
  inscritos: number;
  etapa_atual?: string;
  link: string;
  status: string;
  data_publicacao: string;
  exam_type?: string;
  wrong_answer_penalty?: number;
  alternatives_count?: number;
  localidades?: string[];
  
  // Weight fields for all sections
  basic_knowledge_weight?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_3_weight?: number;
  specific_knowledge_weight?: number; // For backward compatibility
  discursive_weight?: number;
  case_study_1_weight?: number;
  case_study_2_weight?: number;
  case_study_3_weight?: number;
  
  created_at?: string;
  updated_at?: string;
  predefined_job_title?: string;
  custom_job_title?: string;
  
  // Added missing properties
  created_by_user_id?: string;
  is_admin_created?: boolean;
  
  // Add these missing properties that components are expecting
  has_basic_knowledge?: boolean;
  has_specific_knowledge_1?: boolean;
  has_specific_knowledge_2?: boolean;
  has_specific_knowledge_3?: boolean;
  has_discursive?: boolean;
  has_case_study_1?: boolean;
  has_case_study_2?: boolean;
  has_case_study_3?: boolean;
  basic_knowledge_questions?: number;
  specific_knowledge_1_questions?: number;
  specific_knowledge_2_questions?: number;
  specific_knowledge_3_questions?: number;
  
  // Reservation quota fields
  has_ampla_concorrencia?: boolean;
  has_ppp?: boolean;
  has_pcd?: boolean;
  has_hipossuficientes?: boolean;
  has_indigenas?: boolean;
  has_transsexuais?: boolean;
}

export interface ConcursoFilter {
  orgao?: string;
  banca?: string;
  status?: string;
}

export interface UserRanking {
  id: string;
  user_id: string;
  concurso_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface UserRankingDisplay {
  concursoId: string;
  concursoTitle: string;
  position: number;
  score: number;
}





  
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  concursos_aprovados?: string;
  concursos_participando?: string;
  created_at: string;
  updated_at: string;
  status_concurseiro?: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

// Helper to determine which specific knowledge sections are enabled
export const getEnabledKnowledgeSections = (concurso: Concurso) => {
  return {
    basicKnowledge: concurso.basic_knowledge_weight !== undefined, // Basic knowledge is enabled by default
    specificKnowledge1: concurso.specific_knowledge_1_weight !== undefined, // Specific knowledge 1 is enabled by default
    specificKnowledge2: concurso.specific_knowledge_2_weight !== undefined,
    specificKnowledge3: concurso.specific_knowledge_3_weight !== undefined,
    discursive: concurso.discursive_weight !== undefined,
    caseStudy1: concurso.case_study_1_weight !== undefined,
    caseStudy2: concurso.case_study_2_weight !== undefined,
    caseStudy3: concurso.case_study_3_weight !== undefined
  };
};

// Helper to get column configuration for ranking table
export const getRankingTableColumns = (concurso: Concurso) => {
  const sections = getEnabledKnowledgeSections(concurso);
  
  const columns = [
    { id: 'position', label: '#', align: 'center', width: '16px' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ];
  
  if (sections.basicKnowledge) {
    columns.push({ id: 'basicKnowledgeScore', label: 'C.B.', align: 'right' });
  }
  
  if (sections.specificKnowledge1) {
    columns.push({ id: 'specificKnowledge1Score', label: 'C.E.', align: 'right' });
  }
  
  if (sections.specificKnowledge2) {
    columns.push({ id: 'specificKnowledge2Score', label: 'C.E.2', align: 'right' });
  }
  
  if (sections.specificKnowledge3) {
    columns.push({ id: 'specificKnowledge3Score', label: 'C.E.3', align: 'right' });
  }
  
  if (sections.discursive) {
    columns.push({ id: 'discursiveScore', label: 'Dis.', align: 'right' });
  }
  
  if (sections.caseStudy1) {
    columns.push({ id: 'caseStudy1Score', label: 'Est.Cas.', align: 'right' });
  }
  
  if (sections.caseStudy2) {
    columns.push({ id: 'caseStudy2Score', label: 'Est.Cas.2', align: 'right' });
  }
  
  if (sections.caseStudy3) {
    columns.push({ id: 'caseStudy3Score', label: 'Est.Cas.3', align: 'right' });
  }
  
  return columns;
};
