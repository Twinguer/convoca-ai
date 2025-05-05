
// Add this to your existing types.ts file or create a new one

export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  etapa_atual: string | null;
  status: string;
  link: string | null;
  vagas: number | null;
  inscritos: number | null;
  data_publicacao: string | null;
  wrong_answer_penalty: number | null;
  alternatives_count: number | null;
  basic_knowledge_weight: number | null;
  specific_knowledge_weight: number | null;
  specific_knowledge_1_weight: number | null;
  specific_knowledge_2_weight: number | null;
  specific_knowledge_3_weight: number | null;
  discursive_weight: number | null;
  case_study_1_weight: number | null;
  case_study_2_weight: number | null;
  case_study_3_weight: number | null;
  basic_knowledge_questions: number | null;
  specific_knowledge_1_questions: number | null;
  specific_knowledge_2_questions: number | null;
  specific_knowledge_3_questions: number | null;
  has_basic_knowledge: boolean;
  has_specific_knowledge_1: boolean;
  has_specific_knowledge_2: boolean;
  has_specific_knowledge_3: boolean;
  has_discursive: boolean;
  has_case_study_1: boolean;
  has_case_study_2: boolean;
  has_case_study_3: boolean;
  has_ampla_concorrencia: boolean;
  has_ppp: boolean;
  has_pcd: boolean;
  has_indigenas: boolean;
  has_hipossuficientes: boolean;
  has_transsexuais: boolean;
  exam_type: string;
  created_by_user_id: string | null;
  is_admin_created: boolean;
  // Campos de nota mínima
  has_minimum_score?: boolean;
  minimum_score_type?: 'knowledge' | 'subject';
  minimum_score_unit_type?: 'percentage' | 'absolute';
  total_minimum_score?: number;
  basic_knowledge_minimum_score?: number;
  specific_knowledge_1_minimum_score?: number;
  specific_knowledge_2_minimum_score?: number;
  specific_knowledge_3_minimum_score?: number;
  discursive_minimum_score?: number;
  case_study_1_minimum_score?: number;
  case_study_2_minimum_score?: number;
  case_study_3_minimum_score?: number;
}

export interface UserRankingDisplay {
  id: string;
  score: number;
  basic_knowledge_score: number;
  specific_knowledge_score: number;
  discursive_score: number;
  created_at: string;
  position?: number;
  concurso_id: string;
  isClassified?: boolean; // Novo campo que indica se o candidato está classificado
  concursos?: {
    id: string;
    titulo: string;
    orgao: string;
    banca: string;
    has_minimum_score?: boolean;
  };
  concursoId?: string;
  concursoTitle?: string;
}

export function getRankingTableColumns(concurso: Concurso): string[] {
  const columns = [];
  
  // Posição e nome do candidato são sempre incluídos
  columns.push('position', 'name');
  
  // Score total
  columns.push('score');
  
  // Pontuações específicas
  if (concurso.has_basic_knowledge) columns.push('basic');
  if (concurso.has_specific_knowledge_1) columns.push('specific1');
  if (concurso.has_specific_knowledge_2) columns.push('specific2');
  if (concurso.has_specific_knowledge_3) columns.push('specific3');
  if (concurso.has_discursive) columns.push('discursive');
  if (concurso.has_case_study_1) columns.push('caseStudy1');
  if (concurso.has_case_study_2) columns.push('caseStudy2');
  if (concurso.has_case_study_3) columns.push('caseStudy3');
  
  // Status de classificação
  if (concurso.has_minimum_score) columns.push('status');
  
  return columns;
}
