// Stub service for useUserAnswersV2 compatibility

export interface UserAnswerV2 {
  id: string;
  user_id: string;
  ranking_id: string;
  booklet_id: string;
  question_number: number;
  user_answer: string;
  created_at: string;
  updated_at: string;
}

export interface RankingAnswerV2 {
  id: string;
  ranking_id: string;
  booklet_id: string;
  official_answers: Record<number, string>;
  created_at: string;
}

export interface AnswerStats {
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  accuracy: number;
}

export const fetchUserAnswers = async (userId: string, rankingId: string): Promise<UserAnswerV2[]> => {
  // Stub - retorna array vazio
  return [];
};

export const fetchRankingAnswers = async (rankingId: string): Promise<RankingAnswerV2 | null> => {
  // Stub - retorna null
  return null;
};

export const saveUserAnswers = async (
  userId: string,
  rankingId: string,
  answers: Record<number, string>
): Promise<void> => {
  // Stub - no-op
  console.log('saveUserAnswers stub called', { userId, rankingId, answers });
};

export const calculateAnswerStats = (
  userAnswers: Record<number, string>,
  officialAnswers: Record<number, string>
): AnswerStats => {
  // Stub - retorna estatísticas vazias
  return {
    total_questions: 0,
    answered_questions: 0,
    correct_answers: 0,
    wrong_answers: 0,
    accuracy: 0
  };
};
