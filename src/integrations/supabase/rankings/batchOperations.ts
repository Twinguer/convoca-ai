
import { supabase } from '../client';

/**
 * Função para recalcular as pontuações de todos os usuários em um concurso
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    // Use the improved recalculate function from the database
    const { data, error } = await supabase.rpc(
      'recalculate_all_scores_improved',
      { p_concurso_id: concursoId }
    );
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error recalculating all user scores:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
};

/**
 * Function to handle saving answers with score calculation in real-time
 */
export const saveAnswersAndCalculateScore = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string }[],
  subjectiveScores: {
    discursiveScore?: number | null;
    caseStudy1Score?: number | null;
    caseStudy2Score?: number | null;
    caseStudy3Score?: number | null;
  } = {}
) => {
  try {
    console.log('[saveAnswersAndCalculateScore] Saving answers for ranking:', rankingId);
    
    // Format answers as required by the RPC
    const formattedAnswers = answers.map(answer => ({
      questionNumber: answer.questionNumber,
      answer: answer.answer
    }));
    
    // Call the RPC function that handles saving answers and calculating scores
    const { data, error } = await supabase.rpc(
      'save_user_answers_and_calculate_scores',
      {
        p_ranking_id: rankingId,
        p_concurso_id: concursoId,
        p_answers: formattedAnswers,
        p_discursive_score: subjectiveScores.discursiveScore || 0,
        p_case_study_1_score: subjectiveScores.caseStudy1Score || 0,
        p_case_study_2_score: subjectiveScores.caseStudy2Score || 0,
        p_case_study_3_score: subjectiveScores.caseStudy3Score || 0
      }
    );
    
    if (error) throw error;
    
    console.log('[saveAnswersAndCalculateScore] Success response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[saveAnswersAndCalculateScore] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
};
