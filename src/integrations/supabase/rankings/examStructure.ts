
/**
 * Calcula a estrutura (faixas) do exame com base nas configurações do concurso
 */
export const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  // Prepara informações das disciplinas (se existirem)
  const subjectsInfo = concurso.subjects && Array.isArray(concurso.subjects) 
    ? concurso.subjects.map((subject: any) => ({
        name: subject.name,
        code: subject.code,
        questions: subject.questions || 0,
        weight: subject.weight || 1,
        minimumScore: subject.minimum_score || 0,
        unitType: subject.minimum_score_unit_type || 'percentage'
      }))
    : [];
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    totalQuestions: specific3End,
    // Adicionar informações de nota mínima
    minimumScores: {
      unitType: concurso.minimum_score_unit_type || 'percentage',
      basic: concurso.basic_knowledge_minimum_score || 0,
      specific1: concurso.specific_knowledge_1_minimum_score || 0,
      specific2: concurso.specific_knowledge_2_minimum_score || 0,
      specific3: concurso.specific_knowledge_3_minimum_score || 0,
      discursive: concurso.discursive_minimum_score || 0,
      caseStudy1: concurso.case_study_1_minimum_score || 0,
      caseStudy2: concurso.case_study_2_minimum_score || 0,
      caseStudy3: concurso.case_study_3_minimum_score || 0
    },
    // Adicionar informações de nota mínima para cotistas
    quotaMinimumScore: {
      enabled: concurso.has_quota_minimum_score || false,
      score: concurso.quota_minimum_score || 0,
      unitType: concurso.quota_minimum_score_unit_type || 'percentage'
    },
    // Informações das disciplinas
    subjects: subjectsInfo,
    // Tipo de nota mínima (conhecimento ou disciplina)
    minimumScoreType: concurso.minimum_score_type || 'knowledge'
  };
};

/**
 * Verifica se uma pontuação é menor que a pontuação mínima requerida
 * @param score Pontuação a ser verificada
 * @param minimumScore Pontuação mínima requerida 
 * @param totalQuestions Total de questões da seção
 * @param unitType Tipo de unidade (porcentagem ou pontos absolutos)
 * @returns True se a pontuação estiver abaixo do mínimo
 */
export const isScoreBelowMinimum = (
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

/**
 * Verifica se uma pontuação é menor que a pontuação mínima requerida para cotistas
 * @param score Pontuação a ser verificada
 * @param concurso Configurações do concurso
 * @param totalQuestions Total de questões
 * @returns True se a pontuação estiver abaixo do mínimo para cotistas
 */
export const isQuotaScoreBelowMinimum = (
  score: number,
  concurso: any,
  totalQuestions: number
): boolean => {
  if (!concurso.has_quota_minimum_score || !concurso.quota_minimum_score || concurso.quota_minimum_score <= 0) {
    return false;
  }
  
  const unitType = concurso.quota_minimum_score_unit_type || 'percentage';
  const minimumScore = concurso.quota_minimum_score;
  
  if (unitType === 'percentage') {
    const scorePercentage = (score / totalQuestions) * 100;
    return scorePercentage < minimumScore;
  }
  
  return score < minimumScore;
};
