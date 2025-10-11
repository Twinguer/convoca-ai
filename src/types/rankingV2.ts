// Types for the new ranking structure (Phase 1)
// These types will be used for the new create_ranking_new and user_ranking_new tables

export interface CreateRankingNew {
  id: string;
  creator_id: string;
  titulo: string;
  orgao: string;
  banca: string;
  status: string;
  created_at: string;
  updated_at: string;
  ranking_config: RankingConfig;
  official_answer_key: OfficialAnswerKey;
  question_booklets?: QuestionBooklets;
}

export interface UserRankingNew {
  id: string;
  ranking_id: string;
  user_id: string;
  score: number;
  position: number;
  reservation_type: string;
  created_at: string;
  updated_at: string;
  user_answers: UserAnswers;
  calculated_scores: CalculatedScores;
  metadata: UserRankingMetadata;
}

export interface RankingConfig {
  basic_info: {
    titulo: string;
    orgao: string;
    banca: string;
    data_publicacao: string;
    etapa_atual: string;
    status: string;
    link: string;
    vagas: number;
    inscritos: number;
  };
  
  exam_config: {
    exam_type: 'Alternativas' | 'Certo ou Errado' | 'Múltipla Escolha';
    alternatives_count: number;
    wrong_answer_penalty: number;
    has_basic_knowledge: boolean;
    basic_knowledge_questions: number;
    basic_knowledge_weight: number;
    has_specific_knowledge_1: boolean;
    specific_knowledge_1_questions: number;
    specific_knowledge_1_weight: number;
    has_specific_knowledge_2: boolean;
    specific_knowledge_2_questions: number;
    specific_knowledge_2_weight: number;
    has_specific_knowledge_3: boolean;
    specific_knowledge_3_questions: number;
    specific_knowledge_3_weight: number;
    has_discursive: boolean;
    discursive_weight: number;
    has_case_study_1: boolean;
    case_study_1_weight: number;
    has_case_study_2: boolean;
    case_study_2_weight: number;
    has_case_study_3: boolean;
    case_study_3_weight: number;
  };
  
  quota_config: {
    has_ampla_concorrencia: boolean;
    has_ppp: boolean;
    has_pcd: boolean;
    has_hipossuficientes: boolean;
    has_indigenas: boolean;
    has_transsexuais: boolean;
  };
  
  localidades: string[];
  
  metadata: {
    version: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    participant_count: number;
  };
}

export interface OfficialAnswerKey {
  booklets: {
    [bookletId: string]: {
      booklet_name: string;
      questions: {
        [questionNumber: string]: {
          correct_answer: string;
          weight: number;
          section: 'basic_knowledge' | 'specific_knowledge_1' | 'specific_knowledge_2' | 'specific_knowledge_3' | 'discursive' | 'case_study_1' | 'case_study_2' | 'case_study_3';
          discipline?: string;
          is_annulled: boolean;
          annulment_reason?: string;
        };
      };
    };
  };
  
  metadata: {
    total_questions: number;
    basic_knowledge_questions: number;
    specific_knowledge_1_questions: number;
    specific_knowledge_2_questions: number;
    specific_knowledge_3_questions: number;
    discursive_questions: number;
    case_study_1_questions: number;
    case_study_2_questions: number;
    case_study_3_questions: number;
    last_updated: string;
    version: string;
  };
}

export interface QuestionBooklets {
  booklets: {
    [bookletId: string]: {
      booklet_name: string;
      questions: {
        [questionNumber: string]: {
          question_text: string;
          alternatives: {
            A: string;
            B: string;
            C: string;
            D: string;
            E: string;
          };
          section: string;
          discipline?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          source?: string;
        };
      };
    };
  };
}

export interface UserAnswers {
  booklets: {
    [bookletId: string]: {
      booklet_name: string;
      answers: {
        [questionNumber: string]: {
          user_answer: string;
          is_blank: boolean;
          answered_at: string;
          time_spent_seconds?: number;
        };
      };
    };
  };
  
  metadata: {
    total_questions_answered: number;
    total_blank_questions: number;
    completion_percentage: number;
    last_updated: string;
    submission_count: number;
  };
}

export interface CalculatedScores {
  basic_scores: {
    total: number;
    basic_knowledge: number;
    specific_knowledge: number;
    discursive: number;
    case_studies: {
      case_study_1: number;
      case_study_2: number;
      case_study_3: number;
    };
  };
  
  weighted_scores: {
    basic_knowledge: number;
    specific_knowledge: number;
    discursive: number;
    case_studies: {
      case_study_1: number;
      case_study_2: number;
      case_study_3: number;
    };
  };
  
  discipline_scores: {
    [disciplineId: string]: {
      score: number;
      weighted_score: number;
      questions_answered: number;
      correct_answers: number;
      accuracy: number;
    };
  };
  
  custom_discipline_scores: {
    [customDisciplineId: string]: {
      score: number;
      weighted_score: number;
    };
  };
  
  minimum_checks: {
    below_total_minimum: boolean;
    below_block_minimums: string[];
    below_discipline_minimums: string[];
    minimum_details: {
      total_required: number;
      total_achieved: number;
      block_requirements: Record<string, { required: number; achieved: number }>;
      discipline_requirements: Record<string, { required: number; achieved: number }>;
    };
  };
}

export interface UserRankingMetadata {
  position: number;
  reservation_type: string;
  selected_booklet?: string;
  all_questions_answered: boolean;
  is_score_recalculated: boolean;
  edit_count: number;
  last_updated: string;
  calculation_version: string;
  edit_history: Array<{
    timestamp: string;
    changes: Record<string, any>;
    editor_id: string;
  }>;
}

// Helper types for API responses
export interface RankingWithParticipants {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  status: string;
  participant_count: number;
  created_at: string;
}

export interface UserRankingWithProfile {
  id: string;
  user_id: string;
  score: number;
  position: number;
  reservation_type: string;
  user_name: string;
  avatar_url: string;
  created_at: string;
}

// Types for form data (compatible with existing forms)
export interface CreateRankingFormData {
  // Basic info
  titulo: string;
  orgao: string;
  banca: string;
  data_publicacao: string;
  etapa_atual: string;
  status: string;
  link: string;
  vagas: number;
  inscritos: number;
  
  // Exam config
  exam_type: 'Alternativas' | 'Certo ou Errado' | 'Múltipla Escolha';
  alternatives_count: number;
  wrong_answer_penalty: number;
  
  // Knowledge areas
  has_basic_knowledge: boolean;
  basic_knowledge_questions: number;
  basic_knowledge_weight: number;
  
  has_specific_knowledge_1: boolean;
  specific_knowledge_1_questions: number;
  specific_knowledge_1_weight: number;
  
  has_specific_knowledge_2: boolean;
  specific_knowledge_2_questions: number;
  specific_knowledge_2_weight: number;
  
  has_specific_knowledge_3: boolean;
  specific_knowledge_3_questions: number;
  specific_knowledge_3_weight: number;
  
  has_discursive: boolean;
  discursive_weight: number;
  
  has_case_study_1: boolean;
  case_study_1_weight: number;
  
  has_case_study_2: boolean;
  case_study_2_weight: number;
  
  has_case_study_3: boolean;
  case_study_3_weight: number;
  
  // Quota config
  has_ampla_concorrencia: boolean;
  has_ppp: boolean;
  has_pcd: boolean;
  has_hipossuficientes: boolean;
  has_indigenas: boolean;
  has_transsexuais: boolean;
  
  // Localidades
  localidades: string[];
}
