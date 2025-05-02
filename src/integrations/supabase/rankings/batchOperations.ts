
import { supabase } from '@/integrations/supabase/client';

/**
 * Recalcula as pontuações de todos os usuários para um determinado concurso
 * independentemente do status de autenticação
 * 
 * @param concursoId UUID do concurso
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log("[batchOperations] Recalculando pontuações para todos os usuários do concurso", concursoId);
    
    // Chamar a função de banco de dados que força recálculo para todos os usuários
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', { 
      p_concurso_id: concursoId 
    });
    
    if (error) {
      console.error("[batchOperations] Erro ao recalcular pontuações:", error);
      return { success: false, error: error.message };
    }
    
    // Verifica se foram recalculadas as pontuações
    console.log("[batchOperations] Resultado do recálculo:", data);
    
    // Chama a função para atualizar a flag `is_score_recalculated` para falso,
    // forçando a interface a buscar os dados novamente
    try {
      console.log("[batchOperations] Forçando recálculo em tempo real");
      const realtimeResult = await supabase.rpc('recalculate_all_users_scores_realtime', {
        p_concurso_id: concursoId
      });
      
      if (realtimeResult.error) {
        console.error("[batchOperations] Erro ao forçar recálculo em tempo real:", realtimeResult.error);
      } else {
        console.log("[batchOperations] Recálculo em tempo real ativado:", realtimeResult.data);
      }
    } catch (realtimeError) {
      console.warn("[batchOperations] Erro ao forçar recálculo em tempo real:", realtimeError);
      // Continuamos mesmo com erro
    }
    
    return { 
      success: true, 
      data,
      updatedCount: data?.updatedCount || 0
    };
  } catch (err) {
    console.error("[batchOperations] Erro inesperado ao recalcular pontuações:", err);
    return { success: false, error: String(err) };
  }
};

/**
 * Atualiza os tipos de seção para um determinado concurso
 * 
 * @param concursoId UUID do concurso
 */
export const updateSectionTypes = async (concursoId: string) => {
  try {
    console.log("[batchOperations] Atualizando tipos de seção para o concurso", concursoId);
    
    const { data, error } = await supabase.rpc('update_section_types', {
      p_concurso_id: concursoId
    });
    
    if (error) {
      console.error("[batchOperations] Erro ao atualizar tipos de seção:", error);
      return { success: false, error: error.message };
    }
    
    console.log("[batchOperations] Tipos de seção atualizados com sucesso:", data);
    return { success: true, data };
  } catch (err) {
    console.error("[batchOperations] Erro inesperado ao atualizar tipos de seção:", err);
    return { success: false, error: String(err) };
  }
};
