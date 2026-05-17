import type { StudySession, StudyStatistics } from '@/types/userStudy';
import { calculateStudyStatistics } from '@/utils/userStudyHelpers';
import { defaultUserStudy } from '@/types/userStudy';
import { toLocalDateKey } from '@/utils/studyStatisticsFilters';
import { generateId } from '@/lib/utils';

const QUESTION_TRACKER_SUBJECT = 'Questões avulsas';

export { QUESTION_TRACKER_SUBJECT };

/**
 * Converte entradas legadas de sessionHistory (sem study_sessions) em sessões sintéticas.
 * Usado apenas quando study_sessions está vazio — evita dupla contagem.
 */
export function sessionHistoryToStudySessions(
  history: StudyStatistics['sessionHistory']
): StudySession[] {
  return history.map((entry, index) => {
    const dateKey = toLocalDateKey(entry.date);
    return {
      id: `legacy-history-${index}-${dateKey}`,
      duration_minutes: entry.duration ?? 0,
      questions: entry.questions ?? 0,
      correct_answers: entry.correctAnswers ?? 0,
      session_date: dateKey,
      discipline_name: entry.subject ?? 'Sem Disciplina',
      study_type: entry.type ?? 'manual',
      session_count: 1,
      start_time: '00:00:00',
      created_at: entry.date,
    };
  });
}

function sessionFingerprint(date: string, durationMinutes: number, subject?: string): string {
  return `${toLocalDateKey(date)}|${Math.round(durationMinutes)}|${(subject ?? '').trim().toLowerCase()}`;
}

/**
 * Inclui entradas do sessionHistory que não têm par em study_sessions (ex.: timer antigo).
 */
function mergeOrphanSessionHistory(
  sessions: StudySession[],
  history: StudyStatistics['sessionHistory']
): StudySession[] {
  if (!history?.length) return sessions;

  const known = new Set(
    sessions.map((s) =>
      sessionFingerprint(
        s.session_date ?? s.date ?? s.last_session_date ?? '',
        s.duration_minutes ?? s.total_duration_minutes ?? 0,
        s.discipline_name
      )
    )
  );

  const orphans = sessionHistoryToStudySessions(history).filter((s) => {
    const fp = sessionFingerprint(
      s.session_date ?? '',
      s.duration_minutes ?? 0,
      s.discipline_name
    );
    return !known.has(fp);
  });

  return orphans.length > 0 ? [...sessions, ...orphans] : sessions;
}

/**
 * Resolve lista de sessões: prioriza study_sessions; importa histórico legado sem duplicar.
 */
export function resolveStudySessions(
  sessions: StudySession[] | undefined | null,
  savedStatistics?: StudyStatistics | null
): StudySession[] {
  const list = sessions ?? [];
  const history = savedStatistics?.sessionHistory;

  if (list.length === 0) {
    if (!history?.length) return [];
    return sessionHistoryToStudySessions(history);
  }

  return mergeOrphanSessionHistory(list, history);
}

/**
 * Calcula estatísticas a partir das sessões; se não houver sessões, preserva snapshot salvo válido.
 */
export function resolveStudyStatistics(
  sessions: StudySession[],
  savedStatistics?: StudyStatistics | null
): StudyStatistics {
  if (sessions.length > 0) {
    return calculateStudyStatistics(sessions);
  }

  const saved = savedStatistics;
  if (
    saved &&
    (saved.totalHours > 0 ||
      saved.totalSessions > 0 ||
      saved.questionsAnswered > 0 ||
      (saved.sessionHistory?.length ?? 0) > 0)
  ) {
    return saved;
  }

  return defaultUserStudy.study_statistics as StudyStatistics;
}

export function isQuestionTrackerSession(session: StudySession): boolean {
  return (
    session.discipline_name === QUESTION_TRACKER_SUBJECT &&
    (session.duration_minutes ?? session.total_duration_minutes ?? 0) === 0
  );
}

export function findOrCreateQuestionTrackerSession(
  sessions: StudySession[],
  dateKey: string
): { sessions: StudySession[]; index: number } {
  const existingIndex = sessions.findIndex((s) => {
    const d = s.session_date ?? s.date ?? s.last_session_date;
    return d && toLocalDateKey(d) === dateKey && isQuestionTrackerSession(s);
  });

  if (existingIndex >= 0) {
    return { sessions, index: existingIndex };
  }

  const newSession: StudySession = {
    id: generateId(),
    duration_minutes: 0,
    questions: 0,
    correct_answers: 0,
    session_date: dateKey,
    discipline_name: QUESTION_TRACKER_SUBJECT,
    study_type: 'manual',
    session_count: 1,
    start_time: '00:00:00',
    created_at: new Date().toISOString(),
  };

  return { sessions: [...sessions, newSession], index: sessions.length };
}
