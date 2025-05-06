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
  
  // Exam structure configuration
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
  
  // Section weights
  basic_knowledge_weight?: number;
  specific_knowledge_weight?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_3_weight?: number;
  discursive_weight?: number;
  case_study_1_weight?: number;
  case_study_2_weight?: number;
  case_study_3_weight?: number;
  
  // Minimum scores
  has_minimum_score?: boolean;
  minimum_score_unit_type?: 'percentage' | 'points';
  minimum_score_type?: 'knowledge' | 'subject';
  total_minimum_score?: number;
  basic_knowledge_minimum_score?: number;
  specific_knowledge_1_minimum_score?: number;
  specific_knowledge_2_minimum_score?: number;
  specific_knowledge_3_minimum_score?: number;
  discursive_minimum_score?: number;
  case_study_1_minimum_score?: number;
  case_study_2_minimum_score?: number;
  case_study_3_minimum_score?: number;
  
  // Quota minimum scores
  has_quota_minimum_score?: boolean;
  quota_minimum_score?: number;
  quota_minimum_score_unit_type?: 'percentage' | 'points';
  
  // Subject-level configuration
  subjects?: SubjectConfig[];
  
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
}

export interface SubjectConfig {
  id?: string;
  concurso_id?: string;
  name: string;
  code: string;
  questions: number;
  weight: number;
  minimum_score: number;
  minimum_score_unit_type: 'percentage' | 'points';
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

// Fixed helper to determine which specific knowledge sections are enabled
// Now uses has_* flags instead of weights
export const getEnabledKnowledgeSections = (concurso: Concurso) => {
  return {
    basicKnowledge: concurso.has_basic_knowledge === true,
    specificKnowledge1: concurso.has_specific_knowledge_1 === true,
    specificKnowledge2: concurso.has_specific_knowledge_2 === true,
    specificKnowledge3: concurso.has_specific_knowledge_3 === true,
    discursive: concurso.has_discursive === true,
    caseStudy1: concurso.has_case_study_1 === true,
    caseStudy2: concurso.has_case_study_2 === true,
    caseStudy3: concurso.has_case_study_3 === true
  };
};

// Function to get the table columns for a ranking based on the concurso structure
export const getRankingTableColumns = (concurso: Concurso) => {
  const columns = [
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ];
  
  // Add columns based on enabled sections
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

// Utility to check if a score meets the minimum requirement
export const isScoreBelowMinimum = (score: number, minimumScore: number, totalQuestions: number, unitType: 'percentage' | 'points') => {
  if (minimumScore <= 0) {
    return false;
  }
  
  if (unitType === 'percentage') {
    const percentageScore = (score / totalQuestions) * 100;
    return percentageScore < minimumScore;
  }
  
  return score < minimumScore;
};

// Gera uma sigla (código) baseado no nome da disciplina
export const generateSubjectCode = (name: string): string => {
  if (!name) return 'SUB';
  
  // Para nomes já conhecidos, retorna a sigla predefinida
  const knownSubjects: Record<string, string> = {
    'Português': 'LPT',
    'Inglês': 'ING',
    'Matemática': 'MAT',
    'RLM': 'RLM',
    'Estatística': 'EST',
    'Constitucional': 'COS',
    'Administrativo': 'ADM',
    'Administração': 'ADO',
    'Contabilidade': 'COT',
    'Contabilidade Custos': 'COC',
    'Economia': 'ECO',
    'Tributário': 'TRI',
    'AFO': 'AFO',
    'Legislação Tributária': 'LTC',
    'Tecnologia da informação': 'TIC',
    'Estatuto': 'ETT',
    'Auditoria': 'AUD',
    'Civil': 'CIV',
    'Penal': 'PEN',
    'Informática': 'INF',
    'Empresarial': 'EMP'
  };
  
  if (knownSubjects[name]) {
    return knownSubjects[name];
  }
  
  // Para nomes personalizados, gera uma sigla de 3 letras
  const words = name.split(' ');
  if (words.length === 1) {
    // Uma palavra única - primeiras 3 letras
    return name.substring(0, 3).toUpperCase();
  } else {
    // Múltiplas palavras - primeira letra de cada palavra (até 3)
    let code = '';
    for (let i = 0; i < Math.min(3, words.length); i++) {
      if (words[i] && words[i].length > 0) {
        code += words[i][0];
      }
    }
    return code.toUpperCase();
  }
};

// Lista de disciplinas para o seletor
export const availableSubjects = [
  { name: 'Português', code: 'LPT' },
  { name: 'Inglês', code: 'ING' },
  { name: 'Matemática', code: 'MAT' },
  { name: 'RLM', code: 'RLM' },
  { name: 'Estatística', code: 'EST' },
  { name: 'Constitucional', code: 'COS' },
  { name: 'Administrativo', code: 'ADM' },
  { name: 'Administração', code: 'ADO' },
  { name: 'Contabilidade', code: 'COT' },
  { name: 'Contabilidade Custos', code: 'COC' },
  { name: 'Economia', code: 'ECO' },
  { name: 'Tributário', code: 'TRI' },
  { name: 'AFO', code: 'AFO' },
  { name: 'Legislação Tributária', code: 'LTC' },
  { name: 'Tecnologia da informação', code: 'TIC' },
  { name: 'Estatuto', code: 'ETT' },
  { name: 'Auditoria', code: 'AUD' },
  { name: 'Civil', code: 'CIV' },
  { name: 'Penal', code: 'PEN' },
  { name: 'Informática', code: 'INF' },
  { name: 'Empresarial', code: 'EMP' }
];

/**
 * Verifica se uma pontuação é menor que a pontuação mínima requerida para cotistas
 * @param score Pontuação a ser verificada
 * @param minimumScore Pontuação mínima requerida 
 * @param totalQuestions Total de questões da seção
 * @param unitType Tipo de unidade (porcentagem ou pontos absolutos)
 * @returns True se a pontuação estiver abaixo do mínimo
 */
export const isQuotaScoreBelowMinimum = (
  score: number, 
  minimumScore: number, 
  totalQuestions: number, 
  unitType: 'percentage' | 'points'
): boolean => {
  if (minimumScore <= 0) {
    return false;
  }
  
  if (unitType === 'percentage') {
    const scorePercentage = (score / totalQuestions) * 100;
    return scorePercentage < minimumScore;
  }
  
  return score < minimumScore;
};
