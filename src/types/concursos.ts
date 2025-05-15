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
  
  // Estrutura de conhecimentos customizados (agora único modo)
  has_custom_knowledge: boolean; // Mantemos por compatibilidade, mas sempre será true
  
  // Configuração de exame
  exam_type?: string;
  alternatives_count?: number;
  wrong_answer_penalty?: number;
  
  // Informações de trabalho 
  predefined_job_title?: string | null;
  custom_job_title?: string | null;
  
  // Tipos de reserva
  has_ampla_concorrencia?: boolean;
  has_ppp?: boolean;
  has_pcd?: boolean;
  has_hipossuficientes?: boolean;
  has_indigenas?: boolean;
  has_transsexuais?: boolean;
  
  // Flag de administrador
  is_admin_update?: boolean;
  
  // Array de disciplinas (modo customizável)
  disciplines?: Array<{
    id?: string;
    type: string;
    name: string;
    isEnabled: boolean;
    questionCount?: number;
    weight?: number;
    blockId?: string; // ID do bloco ao qual pertence
    blockName?: string; // Nome do bloco
    blockWeight?: number; // Peso do bloco
  }>;
  
  // Array de blocos de disciplinas
  discipline_blocks?: Array<{
    id: string;
    name: string;
    weight?: number;
    disciplines: Array<{
      id?: string;
      type: string;
      name: string;
      isEnabled: boolean;
      questionCount?: number;
      weight?: number;
    }>;
  }>;

  // Manteremos por retrocompatibilidade, mas não serão mais usados ativamente
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
  
  basic_knowledge_weight?: number;
  specific_knowledge_1_weight?: number;
  specific_knowledge_2_weight?: number;
  specific_knowledge_3_weight?: number;
  discursive_weight?: number;
  case_study_1_weight?: number;
  case_study_2_weight?: number;
  case_study_3_weight?: number;
  custom_knowledge_questions?: number;
  custom_knowledge_weight?: number;
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

// SectionType mantém compatibilidade mas agora pode ser qualquer string
export type SectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive' 
  | 'case_study1' 
  | 'case_study2' 
  | 'case_study3'
  | string; 

// Função auxiliar para determinar quais seções estão habilitadas
export const getEnabledKnowledgeSections = (concurso: Concurso) => {
  const enabledSections: Record<string, boolean> = {
    useCustomKnowledge: true
  };
  
  // Adicionar seções customizadas baseadas nas disciplinas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.type) {
        enabledSections[discipline.type] = true;
      }
    });
  }
  
  return enabledSections;
};

// Função para obter as colunas de tabela para um ranking baseado na estrutura do concurso
export const getRankingTableColumns = (concurso: Concurso) => {
  const columns = [
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ];

  // Adicionar colunas baseadas nas disciplinas customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
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
  }
  
  // Adicionar colunas para partes subjetivas
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
