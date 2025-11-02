import { supabase } from '../client';

interface BatchRecalculationResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
  details?: any;
}

export const recalculateAllUserScores = async (concursoId: string): Promise<BatchRecalculationResult> => {
  try {
    console.log(`[recalculateAllUserScores] Starting batch recalculation for concurso`);

    // Verificar se o concursoId é válido
    if (!concursoId) {
      console.error('[recalculateAllUserScores] Invalid concursoId: Database operation failed');
      return { success: false, error: 'ID do concurso inválido' };
    }

    // ✅ CORREÇÃO: Usar função wrapper recalc_concurso_scores_public que resolve ambiguidade de tipos
    // Esta função aceita UUID e chama internamente recalculate_all_scores_with_weights
    console.log('[recalculateAllUserScores] Calling Supabase RPC...');
    const { data, error } = await supabase.rpc('recalc_concurso_scores_public', {
      p_concurso_id: concursoId
    });

    console.log('[recalculateAllUserScores] Supabase RPC response recebida');

    if (error) {
      console.error('[recalculateAllUserScores] Error calling PostgreSQL function: Database operation failed');
      return { success: false, error: `Erro ao recalcular pontuações: ${error.message}` };
    }

    console.log('[recalculateAllUserScores] PostgreSQL function result: Data received');

    if (!data) {
      console.error('[recalculateAllUserScores] No data returned from PostgreSQL function');
      return { success: false, error: 'Nenhum dado retornado da função PostgreSQL' };
    }

    // Verificar se data é um objeto válido (pode ser jsonb ou json)
    if (!data || typeof data !== 'object') {
      console.error('[recalculateAllUserScores] Invalid data type returned: Database operation failed');
      return { success: false, error: 'Nenhum dado retornado da função PostgreSQL' };
    }

    // A função recalc_concurso_scores_public retorna um objeto JSON com success e updatedCount
    const result = data as any;
    
    if (result.success === false || !result.success) {
      console.error('[recalculateAllUserScores] PostgreSQL function returned error:', result.error || 'Erro desconhecido');
      return { success: false, error: result.error || result.message || 'Erro desconhecido na função PostgreSQL' };
    }

    console.log(`[recalculateAllUserScores] Successfully recalculated scores`);

    return {
      success: true,
      updatedCount: result.updatedCount || 0,
      details: {
        executionTimeMs: result.executionTimeMs || 0,
        message: `Recálculo concluído em ${result.executionTimeMs || 0}ms`
      }
    };

  } catch (error) {
    console.error('[recalculateAllUserScores] Unexpected error: Database operation failed');
    return { 
      success: false, 
      error: String(error)
    };
  }
};
