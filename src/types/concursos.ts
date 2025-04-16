
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
  basic_knowledge_weight?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_3_weight?: number;
  discursive_weight?: number;
  case_study_1_weight?: number;
  case_study_2_weight?: number;
  case_study_3_weight?: number;
  created_at?: string;
  updated_at?: string;
  predefined_job_title?: string;
  custom_job_title?: string;
  
  // Exam structure fields
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
  
  // New reservation quota types
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

export interface UserAnswer {
  id: string;
  user_ranking_id: string;
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnswerKey {
  id: string;
  concurso_id: string;
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
  is_specific_1: boolean;
  is_specific_2: boolean;
  created_at: string;
  updated_at: string;
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
