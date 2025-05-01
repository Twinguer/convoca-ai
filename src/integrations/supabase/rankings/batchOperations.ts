
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
    const { data, error } = await supabase.rpc('recalculate_all_users_scores_realtime', { 
      p_concurso_id: concursoId 
    });
    
    if (error) {
      console.error("[batchOperations] Erro ao recalcular pontuações:", error);
      return { success: false, error: error.message };
    }
    
    console.log("[batchOperations] Resultado do recálculo:", data);
    return { success: true, data };
  } catch (err) {
    console.error("[batchOperations] Erro inesperado ao recalcular pontuações:", err);
    return { success: false, error: String(err) };
  }
};
