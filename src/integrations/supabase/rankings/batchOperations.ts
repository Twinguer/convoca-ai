
import { supabase } from '@/integrations/supabase/client';

/**
 * Recalcula as pontuações para todos os usuários em um concurso específico.
 * 
 * @param concursoId - O ID do concurso para recalcular pontuações
 * @returns Uma promessa que resolve para um objeto com status de sucesso e contagem
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  console.log(`[recalculateAllUserScores] Iniciando recálculo para concurso: ${concursoId}`);
  
  try {
    // Usar a função RPC com SECURITY DEFINER para recálculo em lote
    const { data, error } = await supabase
      .rpc('recalculate_all_scores_with_weights', { 
        p_concurso_id: concursoId 
      });
    
    if (error) {
      console.error('[recalculateAllUserScores] Erro ao executar RPC:', error);
      return {
        success: false,
        error: `Erro ao recalcular pontuações: ${error.message}`,
        updatedCount: 0
      };
    }
    
    // Log para depuração
    console.log(`[recalculateAllUserScores] Resultado da RPC:`, data);
    
    // Verificar se a resposta contém os dados esperados
    if (data && typeof data === 'object') {
      return {
        success: data.success || true,
        message: `Pontuações recalculadas com sucesso!`,
        updatedCount: data.updatedCount || data.updated_count || 0,
        executionTime: data.executionTimeMs || data.execution_time_ms
      };
    }
    
    return {
      success: true,
      message: 'Pontuações recalculadas com sucesso!',
      updatedCount: 0
    };
  } catch (error) {
    console.error('[recalculateAllUserScores] Erro ao recalcular pontuações:', error);
    return {
      success: false,
      error: `Erro ao recalcular pontuações: ${error}`,
      updatedCount: 0
    };
  }
};

// Função auxiliar para marcar todas as pontuações para recálculo
export const markAllScoresForRecalculation = async (concursoId: string) => {
  console.log(`[markAllScoresForRecalculation] Marcando pontuações para recálculo: ${concursoId}`);
  
  try {
    // Usar RPC para executar função com SECURITY DEFINER que pode atualizar todos os rankings
    const { data, error } = await supabase
      .rpc('recalculate_all_users_scores_realtime', { p_concurso_id: concursoId });
    
    if (error) {
      console.error('[markAllScoresForRecalculation] Erro ao marcar para recálculo:', error);
      return {
        success: false,
        error: `Erro ao marcar para recálculo: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Todas as pontuações marcadas para recálculo',
      updatedCount: data?.updated_count || 0
    };
  } catch (error) {
    console.error('[markAllScoresForRecalculation] Erro inesperado:', error);
    return {
      success: false,
      error: `Erro inesperado: ${error}`
    };
  }
};
