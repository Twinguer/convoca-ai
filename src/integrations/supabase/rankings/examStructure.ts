
/**
 * Calcula a estrutura (faixas) do exame com base nas configurações do concurso
 */
export const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  // Lista de todos os conhecimentos adicionais
  const knowledgeAreas = [
    { code: 'lpt', property: 'lpt_questions' },
    { code: 'ing', property: 'ing_questions' },
    { code: 'mat', property: 'mat_questions' },
    { code: 'rlm', property: 'rlm_questions' },
    { code: 'est', property: 'est_questions' },
    { code: 'cos', property: 'cos_questions' },
    { code: 'adm', property: 'adm_questions' },
    { code: 'ado', property: 'ado_questions' },
    { code: 'cot', property: 'cot_questions' },
    { code: 'coc', property: 'coc_questions' },
    { code: 'eco', property: 'eco_questions' },
    { code: 'tri', property: 'tri_questions' },
    { code: 'afo', property: 'afo_questions' },
    { code: 'ltc', property: 'ltc_questions' },
    { code: 'tic', property: 'tic_questions' },
    { code: 'ett', property: 'ett_questions' },
    { code: 'aud', property: 'aud_questions' },
    { code: 'civ', property: 'civ_questions' },
    { code: 'pen', property: 'pen_questions' },
    { code: 'inf', property: 'inf_questions' },
    { code: 'emp', property: 'emp_questions' },
    { code: 'mtf', property: 'mtf_questions' },
    { code: 'out', property: 'out_questions' }
  ];
  
  // Calcular o fim de cada área de conhecimento adicional
  let currentEnd = specific3End;
  const additionalEnds: Record<string, number> = {};
  
  for (const area of knowledgeAreas) {
    const questions = concurso[area.property] || 0;
    if (questions > 0) {
      currentEnd += questions;
      additionalEnds[`${area.code}End`] = currentEnd;
    }
  }
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    ...additionalEnds,
    totalQuestions: currentEnd
  };
};
