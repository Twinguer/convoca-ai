
import { Concurso } from "@/types/concursos";

export const initializeQuestionTypes = (
  concurso: Concurso, 
  currentTypes: { [key: number]: string }, 
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>
) => {
  // Se já temos tipos de questões definidos, não sobrescreva
  if (Object.keys(currentTypes).length > 0) return;

  const newTypes: { [key: number]: string } = {};
  let currentNumber = 1;

  // Conhecimentos básicos
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
      newTypes[currentNumber++] = 'basic';
    }
  }

  // Conhecimentos específicos 1
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
      newTypes[currentNumber++] = 'specific1';
    }
  }

  // Conhecimentos específicos 2
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
      newTypes[currentNumber++] = 'specific2';
    }
  }

  // Conhecimentos específicos 3
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
      newTypes[currentNumber++] = 'specific3';
    }
  }

  // Novas áreas de conhecimento
  const knowledgeAreas = [
    { has: 'has_lpt', count: 'lpt_questions', type: 'lpt' },
    { has: 'has_ing', count: 'ing_questions', type: 'ing' },
    { has: 'has_mat', count: 'mat_questions', type: 'mat' },
    { has: 'has_rlm', count: 'rlm_questions', type: 'rlm' },
    { has: 'has_est', count: 'est_questions', type: 'est' },
    { has: 'has_cos', count: 'cos_questions', type: 'cos' },
    { has: 'has_adm', count: 'adm_questions', type: 'adm' },
    { has: 'has_ado', count: 'ado_questions', type: 'ado' },
    { has: 'has_cot', count: 'cot_questions', type: 'cot' },
    { has: 'has_coc', count: 'coc_questions', type: 'coc' },
    { has: 'has_eco', count: 'eco_questions', type: 'eco' },
    { has: 'has_tri', count: 'tri_questions', type: 'tri' },
    { has: 'has_afo', count: 'afo_questions', type: 'afo' },
    { has: 'has_ltc', count: 'ltc_questions', type: 'ltc' },
    { has: 'has_tic', count: 'tic_questions', type: 'tic' },
    { has: 'has_ett', count: 'ett_questions', type: 'ett' },
    { has: 'has_aud', count: 'aud_questions', type: 'aud' },
    { has: 'has_civ', count: 'civ_questions', type: 'civ' },
    { has: 'has_pen', count: 'pen_questions', type: 'pen' },
    { has: 'has_inf', count: 'inf_questions', type: 'inf' },
    { has: 'has_emp', count: 'emp_questions', type: 'emp' },
    { has: 'has_mtf', count: 'mtf_questions', type: 'mtf' },
    { has: 'has_out', count: 'out_questions', type: 'out' }
  ];

  for (const area of knowledgeAreas) {
    if (concurso[area.has as keyof Concurso] && concurso[area.count as keyof Concurso]) {
      const questionCount = concurso[area.count as keyof Concurso] as number;
      for (let i = 0; i < questionCount; i++) {
        newTypes[currentNumber++] = area.type;
      }
    }
  }

  // Atualizar estado apenas se houver tipos definidos
  if (Object.keys(newTypes).length > 0) {
    setQuestionType(newTypes);
  }
};
