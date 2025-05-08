
import { Concurso } from "@/types/concursos";

// Interface para mapear as áreas de conhecimento
export interface KnowledgeArea {
  key: string;
  name: string;
  hasField: string;
  questionsField: string;
  weightField: string;
}

// Função para obter todas as áreas de conhecimento disponíveis
export const getAllKnowledgeAreas = (): KnowledgeArea[] => {
  return [
    // Áreas tradicionais
    { key: 'basic', name: 'Conhecimentos Básicos', hasField: 'has_basic_knowledge', questionsField: 'basic_knowledge_questions', weightField: 'basic_knowledge_weight' },
    { key: 'specific1', name: 'Conhecimentos Específicos', hasField: 'has_specific_knowledge_1', questionsField: 'specific_knowledge_1_questions', weightField: 'specific_knowledge_1_weight' },
    { key: 'specific2', name: 'Conhecimentos Específicos 2', hasField: 'has_specific_knowledge_2', questionsField: 'specific_knowledge_2_questions', weightField: 'specific_knowledge_2_weight' },
    { key: 'specific3', name: 'Conhecimentos Específicos 3', hasField: 'has_specific_knowledge_3', questionsField: 'specific_knowledge_3_questions', weightField: 'specific_knowledge_3_weight' },
    
    // Novas áreas de conhecimento
    { key: 'lpt', name: 'Português', hasField: 'has_lpt', questionsField: 'lpt_questions', weightField: 'lpt_weight' },
    { key: 'ing', name: 'Inglês', hasField: 'has_ing', questionsField: 'ing_questions', weightField: 'ing_weight' },
    { key: 'mat', name: 'Matemática', hasField: 'has_mat', questionsField: 'mat_questions', weightField: 'mat_weight' },
    { key: 'rlm', name: 'RLM', hasField: 'has_rlm', questionsField: 'rlm_questions', weightField: 'rlm_weight' },
    { key: 'est', name: 'Estatística', hasField: 'has_est', questionsField: 'est_questions', weightField: 'est_weight' },
    { key: 'cos', name: 'Constitucional', hasField: 'has_cos', questionsField: 'cos_questions', weightField: 'cos_weight' },
    { key: 'adm', name: 'Administrativo', hasField: 'has_adm', questionsField: 'adm_questions', weightField: 'adm_weight' },
    { key: 'ado', name: 'Administração', hasField: 'has_ado', questionsField: 'ado_questions', weightField: 'ado_weight' },
    { key: 'cot', name: 'Contabilidade', hasField: 'has_cot', questionsField: 'cot_questions', weightField: 'cot_weight' },
    { key: 'coc', name: 'Contabilidade Custos', hasField: 'has_coc', questionsField: 'coc_questions', weightField: 'coc_weight' },
    { key: 'eco', name: 'Economia', hasField: 'has_eco', questionsField: 'eco_questions', weightField: 'eco_weight' },
    { key: 'tri', name: 'Tributário', hasField: 'has_tri', questionsField: 'tri_questions', weightField: 'tri_weight' },
    { key: 'afo', name: 'AFO', hasField: 'has_afo', questionsField: 'afo_questions', weightField: 'afo_weight' },
    { key: 'ltc', name: 'Legislação Tributária', hasField: 'has_ltc', questionsField: 'ltc_questions', weightField: 'ltc_weight' },
    { key: 'tic', name: 'Tecnologia da Informação', hasField: 'has_tic', questionsField: 'tic_questions', weightField: 'tic_weight' },
    { key: 'ett', name: 'Estatuto', hasField: 'has_ett', questionsField: 'ett_questions', weightField: 'ett_weight' },
    { key: 'aud', name: 'Auditoria', hasField: 'has_aud', questionsField: 'aud_questions', weightField: 'aud_weight' },
    { key: 'civ', name: 'Civil', hasField: 'has_civ', questionsField: 'civ_questions', weightField: 'civ_weight' },
    { key: 'pen', name: 'Penal', hasField: 'has_pen', questionsField: 'pen_questions', weightField: 'pen_weight' },
    { key: 'inf', name: 'Informática', hasField: 'has_inf', questionsField: 'inf_questions', weightField: 'inf_weight' },
    { key: 'emp', name: 'Empresarial', hasField: 'has_emp', questionsField: 'emp_questions', weightField: 'emp_weight' },
    { key: 'mtf', name: 'Matemática Financeira', hasField: 'has_mtf', questionsField: 'mtf_questions', weightField: 'mtf_weight' },
    
    // Outro (sempre por último)
    { key: 'out', name: 'Outro', hasField: 'has_out', questionsField: 'out_questions', weightField: 'out_weight' },
    
    // Discursivas e Estudos de Caso
    { key: 'discursive', name: 'Discursiva', hasField: 'has_discursive', questionsField: '', weightField: 'discursive_weight' },
    { key: 'case1', name: 'Estudo de Caso', hasField: 'has_case_study_1', questionsField: '', weightField: 'case_study_1_weight' },
    { key: 'case2', name: 'Estudo de Caso 2', hasField: 'has_case_study_2', questionsField: '', weightField: 'case_study_2_weight' },
    { key: 'case3', name: 'Estudo de Caso 3', hasField: 'has_case_study_3', questionsField: '', weightField: 'case_study_3_weight' },
  ];
};

// Função para obter áreas de conhecimento habilitadas para um concurso
export const getEnabledKnowledgeAreas = (concurso: Concurso): KnowledgeArea[] => {
  if (!concurso) return [];
  
  const allAreas = getAllKnowledgeAreas();
  return allAreas.filter(area => {
    const isEnabled = concurso[area.hasField as keyof Concurso] as boolean;
    return isEnabled === true;
  });
};

// Função para obter o total de questões para uma área de conhecimento específica
export const getQuestionsCount = (concurso: Concurso, areaKey: string): number => {
  const area = getAllKnowledgeAreas().find(a => a.key === areaKey);
  if (!area || !area.questionsField) return 0;
  
  return (concurso[area.questionsField as keyof Concurso] as number) || 0;
};

// Função para obter o peso de uma área de conhecimento específica
export const getAreaWeight = (concurso: Concurso, areaKey: string): number => {
  const area = getAllKnowledgeAreas().find(a => a.key === areaKey);
  if (!area || !area.weightField) return 1;
  
  return (concurso[area.weightField as keyof Concurso] as number) || 1;
};

// Função para obter a quantidade total de questões objetivas no concurso
export const getTotalObjectiveQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  let total = 0;
  const allAreas = getAllKnowledgeAreas();
  
  for (const area of allAreas) {
    if (area.questionsField && concurso[area.hasField as keyof Concurso] === true) {
      total += (concurso[area.questionsField as keyof Concurso] as number) || 0;
    }
  }
  
  return total;
};

// Para uso na interface do usuário: gera um label para exibição que inclui o nome customizado para "Outro"
export const getDisplayLabel = (area: KnowledgeArea, concurso?: Concurso): string => {
  if (area.key === 'out' && concurso?.out_name) {
    return `${area.name} (${concurso.out_name})`;
  }
  return area.name;
};
