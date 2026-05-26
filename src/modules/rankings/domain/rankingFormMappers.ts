/** Helpers puros para persistência de ranking (useSaveRanking). */

export const ensureNumeric = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export function createSubjectsStructure(formValues: Record<string, unknown>) {
  return {
    discr: formValues.has_discursive === true,
    discr_min_score: formValues.has_discursive ? ensureNumeric(formValues.discursive_minimum_score) : 0,
    discr_min_score_cotas: formValues.has_discursive
      ? ensureNumeric(formValues.discursive_minimum_score_cotas)
      : 0,
    case1: formValues.has_case_study_1 === true,
    case1_min_score: formValues.has_case_study_1 ? ensureNumeric(formValues.case_study_1_minimum_score) : 0,
    case1_min_score_cotas: formValues.has_case_study_1
      ? ensureNumeric(formValues.case_study_1_minimum_score_cotas)
      : 0,
    case2: formValues.has_case_study_2 === true,
    case2_min_score: formValues.has_case_study_2 ? ensureNumeric(formValues.case_study_2_minimum_score) : 0,
    case2_min_score_cotas: formValues.has_case_study_2
      ? ensureNumeric(formValues.case_study_2_minimum_score_cotas)
      : 0,
    case3: formValues.has_case_study_3 === true,
    case3_min_score: formValues.has_case_study_3 ? ensureNumeric(formValues.case_study_3_minimum_score) : 0,
    case3_min_score_cotas: formValues.has_case_study_3
      ? ensureNumeric(formValues.case_study_3_minimum_score_cotas)
      : 0,
    other: formValues.has_other_subjective === true,
    name_other: formValues.has_other_subjective ? String(formValues.other_subjective_name || '') : '',
    other_min_score: formValues.has_other_subjective
      ? ensureNumeric(formValues.other_subjective_minimum_score)
      : 0,
    other_min_score_cotas: formValues.has_other_subjective
      ? ensureNumeric(formValues.other_subjective_minimum_score_cotas)
      : 0,
  };
}

export function createHasCotaStructure(formValues: Record<string, unknown>) {
  return {
    ppp: formValues.has_ppp === true,
    pcd: formValues.has_pcd === true,
    ind: formValues.has_indigenas === true,
    hip: formValues.has_hipossuficientes === true,
    tra: formValues.has_transsexuais === true,
    min_cota: 0,
  };
}

export function normalizeRankingIdentity(str: string): string {
  return (str || '').replace(/\s+/g, ' ').trim().toUpperCase();
}
