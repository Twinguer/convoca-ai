
export interface SubjectConfig {
  code: string;
  name: string;
  questions: number;
  weight: number;
  minimum_score: number;
  minimum_score_unit_type: 'percentage' | 'points';
}

export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  custom_banca: string | null;
  status: string;
  data_publicacao: string;
  etapa_atual: string;
  link: string;
  vagas: number;
  inscritos: number;
  localidades: string[];
  
  exam_type: string;
  alternatives_count: number;
  wrong_answer_penalty: number;
  
  has_basic_knowledge: boolean;
  basic_knowledge_questions: number;
  basic_knowledge_weight: number;
  basic_knowledge_minimum_score: number;
  
  has_specific_knowledge_1: boolean;
  specific_knowledge_1_questions: number;
  specific_knowledge_1_weight: number;
  specific_knowledge_1_minimum_score: number;
  
  has_specific_knowledge_2: boolean;
  specific_knowledge_2_questions: number;
  specific_knowledge_2_weight: number;
  specific_knowledge_2_minimum_score: number;
  
  has_specific_knowledge_3: boolean;
  specific_knowledge_3_questions: number;
  specific_knowledge_3_weight: number;
  specific_knowledge_3_minimum_score: number;
  
  has_discursive: boolean;
  discursive_weight: number;
  discursive_minimum_score: number;
  
  has_case_study_1: boolean;
  case_study_1_weight: number;
  case_study_1_minimum_score: number;
  
  has_case_study_2: boolean;
  case_study_2_weight: number;
  case_study_2_minimum_score: number;
  
  has_case_study_3: boolean;
  case_study_3_weight: number;
  case_study_3_minimum_score: number;
  
  has_minimum_score: boolean;
  minimum_score_unit_type: 'percentage' | 'points';
  minimum_score_type: 'knowledge' | 'subject';
  total_minimum_score: number;

  has_quota_minimum_score: boolean;
  quota_minimum_score: number;
  quota_minimum_score_unit_type: 'percentage' | 'points';
  
  subjects: SubjectConfig[] | string;

  has_ampla_concorrencia: boolean;
  has_ppp: boolean;
  has_pcd: boolean;
  has_hipossuficientes: boolean;
  has_indigenas: boolean;
  has_transsexuais: boolean;

  created_by_user_id?: string;
  is_admin_created?: boolean;
  is_admin_update?: boolean;
}
