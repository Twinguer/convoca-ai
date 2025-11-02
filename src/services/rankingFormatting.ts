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
    // subjetivas ponderadas (mantemos igual por compatibilidade)
    weightedDiscursiveScore: Number(subjectives.discursive || 0),
    weightedCaseStudy1Score: Number(subjectives.case_study_1 || 0),
    weightedCaseStudy2Score: Number(subjectives.case_study_2 || 0),
    weightedCaseStudy3Score: Number(subjectives.case_study_3 || 0),
    weightedOtherSubjectiveScore: Number(subjectives.other_subjective || 0),
    // disciplinas custom
    customDisciplineScores: Object.fromEntries(
      Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
    ),
    weightedCustomDisciplineScores: Object.fromEntries(
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


