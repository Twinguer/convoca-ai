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
  
  // Novas áreas de conhecimento
  has_lpt?: boolean;
  has_ing?: boolean;
  has_mat?: boolean;
  has_rlm?: boolean;
  has_est?: boolean;
  has_cos?: boolean;
  has_adm?: boolean;
  has_ado?: boolean;
  has_cot?: boolean;
  has_coc?: boolean;
  has_eco?: boolean;
  has_tri?: boolean;
  has_afo?: boolean;
  has_ltc?: boolean;
  has_tic?: boolean;
  has_ett?: boolean;
  has_aud?: boolean;
  has_civ?: boolean;
  has_pen?: boolean;
  has_inf?: boolean;
  has_emp?: boolean;
  has_mtf?: boolean;
  has_out?: boolean;
  
  // Question counts
  basic_knowledge_questions?: number;
  specific_knowledge_1_questions?: number;
  specific_knowledge_2_questions?: number;
  specific_knowledge_3_questions?: number;
  
  // Question counts para novas áreas
  lpt_questions?: number;
  ing_questions?: number;
  mat_questions?: number;
  rlm_questions?: number;
  est_questions?: number;
  cos_questions?: number;
  adm_questions?: number;
  ado_questions?: number;
  cot_questions?: number;
  coc_questions?: number;
  eco_questions?: number;
  tri_questions?: number;
  afo_questions?: number;
  ltc_questions?: number;
  tic_questions?: number;
  ett_questions?: number;
  aud_questions?: number;
  civ_questions?: number;
  pen_questions?: number;
  inf_questions?: number;
  emp_questions?: number;
  mtf_questions?: number;
  out_questions?: number;
  
  // Nome para Outro
  out_name?: string;
  
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
  
  // Section weights para novas áreas
  lpt_weight?: number;
  ing_weight?: number;
  mat_weight?: number;
  rlm_weight?: number;
  est_weight?: number;
  cos_weight?: number;
  adm_weight?: number;
  ado_weight?: number;
  cot_weight?: number;
  coc_weight?: number;
  eco_weight?: number;
  tri_weight?: number;
  afo_weight?: number;
  ltc_weight?: number;
  tic_weight?: number;
  ett_weight?: number;
  aud_weight?: number;
  civ_weight?: number;
  pen_weight?: number;
  inf_weight?: number;
  emp_weight?: number;
  mtf_weight?: number;
  out_weight?: number;
  
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

// Função auxiliar para determinar quais seções de conhecimento estão habilitadas
export const getEnabledKnowledgeSections = (concurso: Concurso) => {
  return {
    basicKnowledge: concurso.has_basic_knowledge === true,
    specificKnowledge1: concurso.has_specific_knowledge_1 === true,
    specificKnowledge2: concurso.has_specific_knowledge_2 === true,
    specificKnowledge3: concurso.has_specific_knowledge_3 === true,
    
    // Novas áreas de conhecimento
    lpt: concurso.has_lpt === true,
    ing: concurso.has_ing === true,
    mat: concurso.has_mat === true,
    rlm: concurso.has_rlm === true,
    est: concurso.has_est === true,
    cos: concurso.has_cos === true,
    adm: concurso.has_adm === true,
    ado: concurso.has_ado === true,
    cot: concurso.has_cot === true,
    coc: concurso.has_coc === true,
    eco: concurso.has_eco === true,
    tri: concurso.has_tri === true,
    afo: concurso.has_afo === true,
    ltc: concurso.has_ltc === true,
    tic: concurso.has_tic === true,
    ett: concurso.has_ett === true,
    aud: concurso.has_aud === true,
    civ: concurso.has_civ === true,
    pen: concurso.has_pen === true,
    inf: concurso.has_inf === true,
    emp: concurso.has_emp === true,
    mtf: concurso.has_mtf === true,
    out: concurso.has_out === true,
    
    discursive: concurso.has_discursive === true,
    caseStudy1: concurso.has_case_study_1 === true,
    caseStudy2: concurso.has_case_study_2 === true,
    caseStudy3: concurso.has_case_study_3 === true
  };
};

// Função para obter as colunas da tabela de ranking com base na estrutura do concurso
export const getRankingTableColumns = (concurso: Concurso) => {
  const columns = [
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ];
  
  // Adicionar colunas com base nas seções habilitadas
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
  
  // Novas áreas de conhecimento - adicionar colunas quando habilitadas
  const knowledgeMap = [
    { has: 'has_lpt', id: 'lptScore', label: 'Português' },
    { has: 'has_ing', id: 'ingScore', label: 'Inglês' },
    { has: 'has_mat', id: 'matScore', label: 'Matemática' },
    { has: 'has_rlm', id: 'rlmScore', label: 'RLM' },
    { has: 'has_est', id: 'estScore', label: 'Estatística' },
    { has: 'has_cos', id: 'cosScore', label: 'Constitucional' },
    { has: 'has_adm', id: 'admScore', label: 'Administrativo' },
    { has: 'has_ado', id: 'adoScore', label: 'Administração' },
    { has: 'has_cot', id: 'cotScore', label: 'Contabilidade' },
    { has: 'has_coc', id: 'cocScore', label: 'Cont. Custos' },
    { has: 'has_eco', id: 'ecoScore', label: 'Economia' },
    { has: 'has_tri', id: 'triScore', label: 'Tributário' },
    { has: 'has_afo', id: 'afoScore', label: 'AFO' },
    { has: 'has_ltc', id: 'ltcScore', label: 'Leg. Tributária' },
    { has: 'has_tic', id: 'ticScore', label: 'TI' },
    { has: 'has_ett', id: 'ettScore', label: 'Estatuto' },
    { has: 'has_aud', id: 'audScore', label: 'Auditoria' },
    { has: 'has_civ', id: 'civScore', label: 'Civil' },
    { has: 'has_pen', id: 'penScore', label: 'Penal' },
    { has: 'has_inf', id: 'infScore', label: 'Informática' },
    { has: 'has_emp', id: 'empScore', label: 'Empresarial' },
    { has: 'has_mtf', id: 'mtfScore', label: 'Mat. Financeira' },
    { has: 'has_out', id: 'outScore', label: 'Outro' }
  ];
  
  knowledgeMap.forEach(knowledge => {
    if (concurso[knowledge.has as keyof Concurso]) {
      columns.push({ id: knowledge.id, label: knowledge.label, align: 'right' });
    }
  });
  
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
