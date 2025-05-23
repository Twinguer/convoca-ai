
import { supabase } from '@/integrations/supabase/client';
import { recalculateUserScore } from './rankingMutations';

/**
 * Recalcula as pontuações para todos os usuários em um concurso específico.
 * 
 * @param concursoId - O ID do concurso para recalcular pontuações
 * @returns Uma promessa que resolve para um objeto com status de sucesso e contagem
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  console.log(`[recalculateAllUserScores] Iniciando recálculo para concurso: ${concursoId}`);
  
  try {
    // Buscar todos os usuários participando deste concurso
    const { data: rankings, error } = await supabase
      .rpc('get_realtime_rankings', { p_concurso_id: concursoId })
      .select('id, user_id');
    
    if (error) {
      console.error('[recalculateAllUserScores] Erro ao buscar participantes:', error);
      return {
        success: false,
        error: `Erro ao buscar participantes: ${error.message}`,
        updatedCount: 0
      };
    }
    
    // Log para depuração
    console.log(`[recalculateAllUserScores] Encontrados ${rankings?.length || 0} participantes`);
    
    // Se não há participantes, retornar sem erro
    if (!rankings || rankings.length === 0) {
      return {
        success: true,
        message: 'Nenhum participante encontrado para recalcular',
        updatedCount: 0
      };
    }
    
    // Processar cada participante em sequência
    // Isso é mais lento, mas reduz a chance de erros de concorrência
    let updatedCount = 0;
    const errors: any[] = [];
    
    for (const ranking of rankings) {
      try {
        // Recalcular pontuação do usuário usando a função existente
        const result = await recalculateUserScore(ranking.user_id, concursoId);
        
        if (result.success) {
          updatedCount++;
        } else {
          errors.push({
            userId: ranking.user_id,
            error: result.error
          });
        }
      } catch (err) {
        console.error(`[recalculateAllUserScores] Erro ao processar usuário ${ranking.user_id}:`, err);
        errors.push({
          userId: ranking.user_id,
          error: err
        });
      }
    }
    
    // Verificar resultados
    if (errors.length > 0) {
      console.warn(`[recalculateAllUserScores] Alguns usuários (${errors.length}) não puderam ser atualizados:`, errors);
    }
    
    return {
      success: true,
      message: `Pontuações recalculadas: ${updatedCount} de ${rankings.length}`,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
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
    const { error } = await supabase
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
      message: 'Todas as pontuações marcadas para recálculo'
    };
  } catch (error) {
    console.error('[markAllScoresForRecalculation] Erro inesperado:', error);
    return {
      success: false,
      error: `Erro inesperado: ${error}`
    };
  }
};
