/**
 * Controle de escrita durante migração study_schedule / weekly_schedule.
 *
 * VITE_MIRROR_WEEKLY_STATS=false → escrita unificada (só study_schedule + ledger).
 * Omitido ou true → mantém espelhamento legado (comportamento anterior).
 */
export const MIRROR_WEEKLY_STATS =
  import.meta.env.VITE_MIRROR_WEEKLY_STATS !== 'false';
