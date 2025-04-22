
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para recalcular pontuações quando o gabarito é atualizado
 */
export const scoreRecalculationService = {
  /**
   * Recalcula as pontuações de todos os usuários após atualização do gabarito
   */
  async recalculateScoresAfterAnswerKeyUpdate(concursoId: string): Promise<{
    success: boolean;
    message: string;
    processedCount?: number;
    errors?: any[];
  }> {
    try {
      console.log('[scoreRecalculationService] Iniciando recálculo em lote para concurso:', concursoId);
      
      // Buscar todos os rankings deste concurso
      const { data: rankings, error: rankingsError } = await supabase
        .from('user_rankings')
        .select('id, user_id')
        .eq('concurso_id', concursoId);
        
      if (rankingsError) {
        console.error('[scoreRecalculationService] Erro ao buscar rankings para recálculo:', rankingsError);
        return {
          success: false,
          message: 'Erro ao buscar rankings para recálculo'
        };
      }
      
      if (!rankings || rankings.length === 0) {
        console.log('[scoreRecalculationService] Nenhum ranking encontrado para recálculo');
        return {
          success: true,
          message: 'Nenhum ranking encontrado para recálculo',
          processedCount: 0
        };
      }
      
      console.log(`[scoreRecalculationService] Encontrados ${rankings.length} rankings para recálculo`);
      
      // Chamar procedimento armazenado para recálculo
      const { data, error } = await supabase.rpc('recalculate_all_scores_after_answer_key_update', {
        p_concurso_id: concursoId,
        p_ranking_ids: rankings.map(r => r.id)
      });
      
      if (error) {
        console.error('[scoreRecalculationService] Erro no recálculo em lote:', error);
        return {
          success: false,
          message: `Erro no recálculo em lote: ${error.message}`
        };
      }
      
      console.log('[scoreRecalculationService] Recálculo em lote concluído:', data);
      
      return {
        success: true,
        message: 'Recálculo de pontuações concluído com sucesso',
        processedCount: rankings.length
      };
    } catch (error: any) {
      console.error('[scoreRecalculationService] Erro não tratado no recálculo:', error);
      return {
        success: false,
        message: `Erro no recálculo: ${error.message}`
      };
    }
  }
};
