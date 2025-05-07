
export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  status: string;
  etapa_atual?: string;
  link?: string;
  vagas?: number;
  inscritos?: number;
  data_publicacao?: string;
  
  // Estrutura da prova
  exam_type?: string;
  alternatives_count?: number;
  wrong_answer_penalty?: number;
  
  // Tipo de estrutura de pontuação mínima
  minimum_score_type?: 'knowledge' | 'subject';
  
  // Disciplinas (quando minimum_score_type === 'subject')
  subjects?: Array<{
    code: string;
    name: string;
    question_count?: number;
    weight?: number;
    minimum_score?: number;
    minimum_score_unit_type?: string;
  }>;
  
  // Áreas de conhecimento
  has_basic_knowledge?: boolean;
  basic_knowledge_questions?: number;
  basic_knowledge_weight?: number;
  basic_knowledge_minimum_score?: number;
  
  has_specific_knowledge_1?: boolean;
  specific_knowledge_1_questions?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_1_minimum_score?: number;
  
  has_specific_knowledge_2?: boolean;
  specific_knowledge_2_questions?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_2_minimum_score?: number;
  
  has_specific_knowledge_3?: boolean;
  specific_knowledge_3_questions?: number;
  specific_knowledge_3_weight?: number;
  specific_knowledge_3_minimum_score?: number;
  
  has_discursive?: boolean;
  discursive_weight?: number;
  discursive_minimum_score?: number;
  
  has_case_study_1?: boolean;
  case_study_1_weight?: number;
  case_study_1_minimum_score?: number;
  
  has_case_study_2?: boolean;
  case_study_2_weight?: number;
  case_study_2_minimum_score?: number;
  
  has_case_study_3?: boolean;
  case_study_3_weight?: number;
  case_study_3_minimum_score?: number;
  
  // Configuração de pontuação mínima global
  has_minimum_score?: boolean;
  total_minimum_score?: number;
  
  // Cotas de reserva
  has_ampla_concorrencia?: boolean;
  has_ppp?: boolean;
  has_pcd?: boolean;
  has_hipossuficientes?: boolean;
  has_indigenas?: boolean;
  has_transsexuais?: boolean;
  has_quota_minimum_score?: boolean;
  quota_minimum_score?: number;
  quota_minimum_score_unit_type?: string;
  
  // Localidades
  localidades?: string[];
  
  // Metadados administrativos
  created_by_user_id?: string;
  is_admin_created?: boolean;
  is_admin_update?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Fields extensions
  custom_banca?: string;
  predefined_job_title?: string;
  custom_job_title?: string;
}

// Add the missing interfaces/types that are being imported
export interface UserRankingDisplay {
  id?: string;
  concursoId?: string;
  concursoTitle?: string;
  score?: number;
  position?: number;
  editCount?: number;
  basicKnowledgeScore?: number;
  specificKnowledgeScore?: number;
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
}

export interface ConcursoFilter {
  status?: string;
  orgao?: string;
  banca?: string;
}

// Add the missing function for getting ranking table columns
export const getRankingTableColumns = (concurso: Concurso) => {
  const columns = [];
  
  if (concurso) {
    if (concurso.has_basic_knowledge) {
      columns.push('basic_knowledge');
    }
    
    if (concurso.has_specific_knowledge_1) {
      columns.push('specific_knowledge_1');
    }
    
    if (concurso.has_specific_knowledge_2) {
      columns.push('specific_knowledge_2');
    }
    
    if (concurso.has_specific_knowledge_3) {
      columns.push('specific_knowledge_3');
    }
    
    if (concurso.has_discursive) {
      columns.push('discursive');
    }
    
    if (concurso.has_case_study_1) {
      columns.push('case_study_1');
    }
    
    if (concurso.has_case_study_2) {
      columns.push('case_study_2');
    }
    
    if (concurso.has_case_study_3) {
      columns.push('case_study_3');
    }
  }
  
  return columns;
};
