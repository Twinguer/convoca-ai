
import { supabase } from '../client';

// Function to recalculate all user scores for a concurso
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log('[recalculateAllUserScores] Iniciando recálculo para concurso:', concursoId);
    
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId
    });
    
    if (error) {
      console.error('[recalculateAllUserScores] Erro durante recálculo:', error);
      return {
        success: false,
        error: error.message || 'Erro durante o recálculo das pontuações',
        updatedCount: 0
      };
    }
    
    console.log('[recalculateAllUserScores] Recálculo concluído:', data);
    
    return {
      success: true,
      updatedCount: data.updatedCount || 0,
      executionTimeMs: data.executionTimeMs || 0
    };
  } catch (error: any) {
    console.error('[recalculateAllUserScores] Erro não tratado:', error);
    return {
      success: false,
      error: error.message || 'Erro durante o recálculo das pontuações',
      updatedCount: 0
    };
  }
};
