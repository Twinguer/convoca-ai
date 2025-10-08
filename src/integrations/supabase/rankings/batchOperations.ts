import { supabase } from '../client';

interface BatchRecalculationResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
  details?: any;
}

export const recalculateAllUserScores = async (concursoId: string): Promise<BatchRecalculationResult> => {
  try {
    console.log(`[recalculateAllUserScores] Starting batch recalculation for concurso: ${concursoId}`);

    // Chamar a função PostgreSQL que já está corrigida
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId
    });

    if (error) {
      console.error('[recalculateAllUserScores] Error calling PostgreSQL function:', error);
      return { success: false, error: `Erro ao recalcular pontuações: ${error.message}` };
    }

    console.log('[recalculateAllUserScores] PostgreSQL function result:', data);

    if (!data || !data.success) {
      console.error('[recalculateAllUserScores] PostgreSQL function returned error:', data?.error);
      return { success: false, error: data?.error || 'Erro desconhecido na função PostgreSQL' };
    }

    console.log(`[recalculateAllUserScores] Successfully recalculated ${data.updatedCount} scores in ${data.executionTimeMs}ms`);

    return {
      success: true,
      updatedCount: data.updatedCount,
      details: {
        executionTimeMs: data.executionTimeMs,
        message: `Recálculo concluído em ${data.executionTimeMs}ms`
      }
    };

  } catch (error) {
    console.error('[recalculateAllUserScores] Unexpected error:', error);
    return { 
      success: false, 
      error: String(error)
    };
  }
};
