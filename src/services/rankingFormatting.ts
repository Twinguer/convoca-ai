// @ts-nocheck
import { Ranking } from './rankingService';

// Build a Ranking row from consolidated_data user_data and profile info
export function buildRankingFromConsolidated(
  rankingId: string,
  userId: string,
  userData: any,
  profileName: string,
  avatarUrl: string | null | undefined,
  getReservationAbbreviation: (reservationType: string) => string
): Ranking {
  const score = Number(userData?.score || 0);

  const subjectives = userData?.subjectives || {};
  const objectScores = userData?.object_scores || {};
  // ✅ CORREÇÃO: Usar weightedCustomDisciplineScores ou weighted_object_scores se disponível
  const weightedObjectScores = userData?.weightedCustomDisciplineScores || userData?.weighted_object_scores || {};
  // ✅ CORREÇÃO: Usar weighted_subjective_scores se disponível (com pesos aplicados)
  const weightedSubjectives = userData?.weighted_subjective_scores || userData?.weightedSubjectiveScores || {};

  const reservationType: string = userData?.reservation_type || 'Ampla Concorrência';

  return {
    id: rankingId,
    position: 0,
    name: profileName,
    score,
    userId,
    avatarUrl: avatarUrl || null,
    // subjetivas (sem peso adicional)
    discursiveScore: Number(subjectives.discursive || 0),
    caseStudy1Score: Number(subjectives.case_study_1 || 0),
    caseStudy2Score: Number(subjectives.case_study_2 || 0),
    caseStudy3Score: Number(subjectives.case_study_3 || 0),
    otherSubjectiveScore: Number(subjectives.other_subjective || 0),
    // ✅ CORREÇÃO: subjetivas ponderadas (usar weighted_subjective_scores se disponível)
    weightedDiscursiveScore: Number(
      weightedSubjectives.weighted_discursive_score || 
      weightedSubjectives.weightedDiscursiveScore || 
      subjectives.discursive || 0
    ),
    weightedCaseStudy1Score: Number(
      weightedSubjectives.weighted_case_study_1_score || 
      weightedSubjectives.weightedCaseStudy1Score || 
      subjectives.case_study_1 || 0
    ),
    weightedCaseStudy2Score: Number(
      weightedSubjectives.weighted_case_study_2_score || 
      weightedSubjectives.weightedCaseStudy2Score || 
      subjectives.case_study_2 || 0
    ),
    weightedCaseStudy3Score: Number(
      weightedSubjectives.weighted_case_study_3_score || 
      weightedSubjectives.weightedCaseStudy3Score || 
      subjectives.case_study_3 || 0
    ),
    weightedOtherSubjectiveScore: Number(
      weightedSubjectives.weighted_other_subjective_score || 
      weightedSubjectives.weightedOtherSubjectiveScore || 
      subjectives.other_subjective || 0
    ),
    // disciplinas custom (sem peso)
    customDisciplineScores: Object.fromEntries(
      Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
    ),
    // ✅ CORREÇÃO: Usar scores com peso (weightedCustomDisciplineScores ou weighted_object_scores)
    weightedCustomDisciplineScores: Object.keys(weightedObjectScores).length > 0
      ? Object.fromEntries(
          Object.entries(weightedObjectScores).filter(([k]) => k.startsWith('custom_'))
        )
      : Object.fromEntries(
          // Fallback: se não houver weighted scores, usar object_scores (sem peso)
          Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
        ),
    // flags mínimos - ler ambos os formatos (camelCase e snake_case) para compatibilidade
    belowMinimum: !!(userData?.belowMinimum || userData?.below_minimum),
    belowDisciplineMinimums: userData?.belowDisciplineMinimums || userData?.below_discipline_minimums || [],
    belowBlockMinimums: userData?.belowBlockMinimums || userData?.below_block_minimums || [],
    // reserva
    reservationType,
    displayReservation: getReservationAbbreviation(reservationType),
    quotaPosition: 0
  };
}


