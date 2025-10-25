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

    // Verificar se o concursoId é válido
    if (!concursoId) {
      console.error('[recalculateAllUserScores] Invalid concursoId:', concursoId);
      return { success: false, error: 'ID do concurso inválido' };
    }

    // Chamar a função PostgreSQL que já está corrigida
    console.log('[recalculateAllUserScores] Calling Supabase RPC...');
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId as string
    });

    console.log('[recalculateAllUserScores] Supabase RPC response recebida');

    if (error) {
      console.error('[recalculateAllUserScores] Error calling PostgreSQL function:', error);
      return { success: false, error: `Erro ao recalcular pontuações: ${error.message}` };
    }

    console.log('[recalculateAllUserScores] PostgreSQL function result:', data);

    if (!data) {
      console.error('[recalculateAllUserScores] No data returned from PostgreSQL function');
      return { success: false, error: 'Nenhum dado retornado da função PostgreSQL' };
    }

    // Verificar se data é um objeto válido
    if (typeof data !== 'object') {
      console.error('[recalculateAllUserScores] Invalid data type returned:', typeof data, data);
      return { success: false, error: 'Tipo de dados inválido retornado da função PostgreSQL' };
    }

    if (!data.success) {
      console.error('[recalculateAllUserScores] PostgreSQL function returned error:', data?.error);
      return { success: false, error: data?.error || 'Erro desconhecido na função PostgreSQL' };
    }

    console.log(`[recalculateAllUserScores] Successfully recalculated ${data.updatedCount} scores in ${data.executionTimeMs}ms`);

    return {
      success: true,
      updatedCount: data.updatedCount || 0,
      details: {
        executionTimeMs: data.executionTimeMs || 0,
        message: `Recálculo concluído em ${data.executionTimeMs || 0}ms`
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
