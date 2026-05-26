/**
 * Módulo Rankings — API pública.
 *
 * Domínio (sem React): acesso, navegação, posição no perfil.
 * UI e hooks permanecem em pages/ e hooks/ até fatiamento futuro.
 */

export {
  canViewClassification,
  canOpenClassificationFromList,
  isParticipatingInConcurso,
  type ClassificationAccessParams,
  type ConsolidatedRankingsData,
} from './domain/rankingAccess';

export {
  openRankingFromList,
  openRankingFromProfile,
  openRankingAfterCreate,
  openSecureRankingWithFallback,
  type RankingNavigationContext,
} from './domain/rankingNavigation';

export {
  getProfileRankingStatus,
  isRankingEliminated,
  type ProfileRankingStatus,
} from './domain/rankingProfilePosition';
