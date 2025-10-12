import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Interface para resposta de usuário
export interface UserAnswerV2 {
  id: string;
  concurso_id: string;
  user_id: string;
  booklet_id: string;
  question_number: number;
  user_answer: string | null;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
}

// Interface para gabarito oficial
export interface RankingAnswerV2 {
  id: string;
  concurso_id: string;
  booklet_id: string;
  question_number: number;
  correct_answer: string;
  weight: number;
  is_nullified: boolean;
  created_at: string;
}

// Interface para estatísticas de respostas
export interface AnswerStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  nullAnswers: number;
  accuracy: number;
  totalPoints: number;
  pointsByBooklet: { [bookletId: string]: number };
  pointsByDiscipline: { [disciplineId: string]: number };
}

// Buscar respostas de um usuário em um ranking
export const fetchUserAnswers = async (
  rankingId: string,
  userId: string
): Promise<UserAnswerV2[]> => {
  try {
    logger.ranking('Fetching user answers V2', `rankingId: ${rankingId}, userId: ${userId}`);

    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        id,
        concurso_id,
        user_id,
        booklet_id,
        question_number,
        user_answer,
        is_correct,
        points_earned,
        created_at
      `)
      .eq('concurso_id', rankingId)
      .eq('user_id', userId)
      .order('booklet_id, question_number');

    if (error) {
      logger.error('Error fetching user answers V2', 'USER_ANSWERS_SERVICE_V2', error);
      throw new Error(`Error fetching user answers: ${error.message}`);
    }

    logger.ranking('User answers fetched V2', `count: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    logger.error('Error fetching user answers V2', 'USER_ANSWERS_SERVICE_V2', error);
    throw error;
  }
};

// Buscar gabarito oficial de um ranking
export const fetchRankingAnswers = async (
  rankingId: string,
  bookletId?: string
): Promise<RankingAnswerV2[]> => {
  try {
    logger.ranking('Fetching ranking answers V2', `rankingId: ${rankingId}, bookletId: ${bookletId || 'all'}`);

    let query = supabase
      .from('ranking_answers')
      .select(`
        id,
        concurso_id,
        booklet_id,
        question_number,
        correct_answer,
        weight,
        is_nullified,
        created_at
      `)
      .eq('concurso_id', rankingId)
      .order('booklet_id, question_number');

    if (bookletId) {
      query = query.eq('booklet_id', bookletId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching ranking answers V2', 'USER_ANSWERS_SERVICE_V2', error);
      throw new Error(`Error fetching ranking answers: ${error.message}`);
    }

    logger.ranking('Ranking answers fetched V2', `count: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    logger.error('Error fetching ranking answers V2', 'USER_ANSWERS_SERVICE_V2', error);
    throw error;
  }
};

// Salvar respostas de um usuário
export const saveUserAnswers = async (
  rankingId: string,
  userId: string,
  answers: Array<{
    booklet_id: string;
    question_number: number;
    user_answer: string | null;
  }>
): Promise<UserAnswerV2[]> => {
  try {
    logger.ranking('Saving user answers V2', `rankingId: ${rankingId}, userId: ${userId}, count: ${answers.length}`);

    // Buscar gabarito oficial para calcular pontuação
    const rankingAnswers = await fetchRankingAnswers(rankingId);
    const answerMap = new Map();
    
    rankingAnswers.forEach(answer => {
      const key = `${answer.booklet_id}-${answer.question_number}`;
      answerMap.set(key, answer);
    });

    // Preparar dados para inserção
    const answersToInsert = answers.map(answer => {
      const key = `${answer.booklet_id}-${answer.question_number}`;
      const correctAnswer = answerMap.get(key);
      
      const isCorrect = correctAnswer && 
        answer.user_answer === correctAnswer.correct_answer && 
        !correctAnswer.is_nullified;
      
      const pointsEarned = isCorrect ? (correctAnswer?.weight || 1) : 0;

      return {
        concurso_id: rankingId,
        user_id: userId,
        booklet_id: answer.booklet_id,
        question_number: answer.question_number,
        user_answer: answer.user_answer,
        is_correct: isCorrect,
        points_earned: pointsEarned
      };
    });

    // Inserir respostas
    const { data, error } = await supabase
      .from('user_answers')
      .upsert(answersToInsert, { 
        onConflict: 'concurso_id,user_id,booklet_id,question_number' 
      })
      .select();

    if (error) {
      logger.error('Error saving user answers V2', 'USER_ANSWERS_SERVICE_V2', error);
      throw new Error(`Error saving user answers: ${error.message}`);
    }

    // Atualizar pontuação do usuário no ranking
    await updateUserScore(rankingId, userId);

    logger.ranking('User answers saved V2', `count: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    logger.error('Error saving user answers V2', 'USER_ANSWERS_SERVICE_V2', error);
    throw error;
  }
};

// Atualizar pontuação do usuário no ranking
export const updateUserScore = async (
  rankingId: string,
  userId: string
): Promise<void> => {
  try {
    logger.ranking('Updating user score V2', `rankingId: ${rankingId}, userId: ${userId}`);

    // Buscar todas as respostas do usuário
    const userAnswers = await fetchUserAnswers(rankingId, userId);
    
    // Calcular pontuação total
    const totalScore = userAnswers.reduce((sum, answer) => sum + answer.points_earned, 0);

    // Atualizar pontuação no user_rankings
    const { error } = await supabase
      .from('user_rankings')
      .update({ score: totalScore })
      .eq('concurso_id', rankingId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error updating user score V2', 'USER_ANSWERS_SERVICE_V2', error);
      throw new Error(`Error updating user score: ${error.message}`);
    }

    logger.ranking('User score updated V2', `score: ${totalScore}`);
  } catch (error) {
    logger.error('Error updating user score V2', 'USER_ANSWERS_SERVICE_V2', error);
    throw error;
  }
};

// Calcular estatísticas de respostas
export const calculateAnswerStats = async (
  rankingId: string,
  userId: string
): Promise<AnswerStats> => {
  try {
    logger.ranking('Calculating answer stats V2', `rankingId: ${rankingId}, userId: ${userId}`);

    const userAnswers = await fetchUserAnswers(rankingId, userId);
    
    const totalQuestions = userAnswers.length;
    const correctAnswers = userAnswers.filter(a => a.is_correct).length;
    const incorrectAnswers = userAnswers.filter(a => !a.is_correct && a.user_answer !== null).length;
    const nullAnswers = userAnswers.filter(a => a.user_answer === null).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalPoints = userAnswers.reduce((sum, answer) => sum + answer.points_earned, 0);

    // Pontuação por caderno
    const pointsByBooklet: { [bookletId: string]: number } = {};
    userAnswers.forEach(answer => {
      pointsByBooklet[answer.booklet_id] = (pointsByBooklet[answer.booklet_id] || 0) + answer.points_earned;
    });

    // Pontuação por disciplina (se houver mapeamento)
    const pointsByDiscipline: { [disciplineId: string]: number } = {};
    // Aqui você pode implementar lógica específica para mapear cadernos para disciplinas

    const stats: AnswerStats = {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      nullAnswers,
      accuracy: Math.round(accuracy * 100) / 100,
      totalPoints,
      pointsByBooklet,
      pointsByDiscipline
    };

    logger.ranking('Answer stats calculated V2', `accuracy: ${stats.accuracy}%, totalPoints: ${stats.totalPoints}`);
    return stats;
  } catch (error) {
    logger.error('Error calculating answer stats V2', 'USER_ANSWERS_SERVICE_V2', error);
    throw error;
  }
};

// Buscar respostas de todos os usuários de um ranking (para admin)
export const fetchAllUserAnswers = async (
  rankingId: string,
  offset = 0,
  limit = 1000
): Promise<UserAnswerV2[]> => {
  try {
    logger.ranking('Fetching all user answers V2', `rankingId: ${rankingId}, offset: ${offset}, limit: ${limit}`);

    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        id,
        concurso_id,
        user_id,
        booklet_id,
        question_number,
        user_answer,
        is_correct,
        points_earned,
        created_at
      `)
      .eq('concurso_id', rankingId)
      .order('user_id, booklet_id, question_number')
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching all user answers V2', 'USER_ANSWERS_SERVICE_V2', error);
      throw new Error(`Error fetching all user answers: ${error.message}`);
    }

    logger.ranking('All user answers fetched V2', `count: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    logger.error('Error fetching all user answers V2', 'USER_ANSWERS_SERVICE_V2', error);
    throw error;
  }
};
