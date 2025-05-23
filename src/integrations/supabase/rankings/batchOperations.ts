
import { supabase } from '../client';

// Função para recalcular todas as pontuações de usuários para um concurso específico
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    const { data, error } = await supabase.rpc(
      'recalculate_all_scores',
      { p_concurso_id: concursoId }
    );

    if (error) {
      console.error('Error recalculating scores:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      updatedCount: data?.updatedCount || 0 
    };
  } catch (error) {
    console.error('Exception recalculating scores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Função para recalcular a pontuação de um usuário específico
export const recalculateUserScore = async (userRankingId: string) => {
  try {
    const { data, error } = await supabase.rpc(
      'calculate_user_score_realtime',
      { p_ranking_id: userRankingId }
    );

    if (error) {
      console.error('Error recalculating user score:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      score: data 
    };
  } catch (error) {
    console.error('Exception recalculating user score:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Função para atualizar as pontuações subjetivas de um usuário
export const updateSubjectiveScores = async (
  userRankingId: string, 
  discursiveScore: number, 
  caseStudy1Score: number, 
  caseStudy2Score: number, 
  caseStudy3Score: number
) => {
  try {
    const { error } = await supabase
      .from('user_rankings')
      .update({
        discursive_score: discursiveScore,
        case_study_1_score: caseStudy1Score,
        case_study_2_score: caseStudy2Score,
        case_study_3_score: caseStudy3Score,
        is_score_recalculated: false
      })
      .eq('id', userRankingId);

    if (error) {
      console.error('Error updating subjective scores:', error);
      return { success: false, error: error.message };
    }

    // Recalcular pontuação após atualizar notas subjetivas
    return await recalculateUserScore(userRankingId);
  } catch (error) {
    console.error('Exception updating subjective scores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
