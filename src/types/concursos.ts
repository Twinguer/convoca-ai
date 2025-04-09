
export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  vagas: number;
  inscritos: number;
  etapa_atual: string;
  link: string;
  status: string;
  data_publicacao: string;
  exam_type?: string;
  wrong_answer_penalty?: number;
  alternatives_count?: number;
  basic_knowledge_weight?: number;
  specific_knowledge_weight?: number;
  discursive_weight?: number;
  created_at?: string;
  updated_at?: string;
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

export interface UserAnswer {
  id: string;
  user_ranking_id: string;
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
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
}

export interface Follower {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}
