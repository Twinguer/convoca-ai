
import { supabase } from '../client';

// Função para recalcular todas as pontuações de usuários para um concurso específico
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`[batchOperations] Iniciando recálculo de todas as pontuações para concurso: ${concursoId}`);

    const { data, error } = await supabase.rpc(
      'recalculate_all_scores',
      { p_concurso_id: concursoId }
    );

    if (error) {
      console.error('[batchOperations] Error recalculating scores:', error);
      return { success: false, error: error.message };
    }

    console.log(`[batchOperations] Recálculo bem-sucedido. Resultados:`, data);
    return { 
      success: true, 
      updatedCount: data?.updatedCount || 0 
    };
  } catch (error) {
    console.error('[batchOperations] Exception recalculating scores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Função para recalcular a pontuação de um usuário específico
export const recalculateUserScore = async (userRankingId: string) => {
  try {
    console.log(`[batchOperations] Recalculando pontuação para ranking: ${userRankingId}`);

    const { data, error } = await supabase.rpc(
      'calculate_user_score_realtime',
      { p_ranking_id: userRankingId }
    );

    if (error) {
      console.error('[batchOperations] Error recalculating user score:', error);
      return { success: false, error: error.message };
    }

    console.log(`[batchOperations] Pontuação recalculada: ${data}`);
    return { 
      success: true, 
      score: data 
    };
  } catch (error) {
    console.error('[batchOperations] Exception recalculating user score:', error);
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
    console.log(`[batchOperations] Atualizando pontuações subjetivas para ranking: ${userRankingId}`);
    console.log(`[batchOperations] Scores: discursive=${discursiveScore}, case1=${caseStudy1Score}, case2=${caseStudy2Score}, case3=${caseStudy3Score}`);

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
      console.error('[batchOperations] Error updating subjective scores:', error);
      return { success: false, error: error.message };
    }

    console.log(`[batchOperations] Pontuações subjetivas atualizadas, iniciando recálculo...`);
    // Recalcular pontuação após atualizar notas subjetivas
    return await recalculateUserScore(userRankingId);
  } catch (error) {
    console.error('[batchOperations] Exception updating subjective scores:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
