
import { supabase } from '@/integrations/supabase/client';
import { scoreRecalculationService } from '@/services/scoreRecalculationService';

/**
 * Recalcula todas as pontuações de usuários para um concurso
 * após o gabarito oficial ser atualizado
 */
export const recalculateAllUserScores = async (concursoId: string): Promise<{
  success: boolean;
  message: string;
  processedCount?: number;
}> => {
  console.log('[batchOperations] Iniciando recálculo para concurso ID:', concursoId);
  
  try {
    // Usar o serviço especializado
    const result = await scoreRecalculationService.recalculateScoresAfterAnswerKeyUpdate(concursoId);
    
    // Registrar resultado
    console.log('[batchOperations] Resultado do recálculo em lote:', result);
    
    if (result.success) {
      // Invalidar caches no cliente
      console.log('[batchOperations] Tentando invalidar caches...');
      
      return {
        success: true,
        message: `Recálculo concluído com sucesso para ${result.processedCount} rankings`,
        processedCount: result.processedCount
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  } catch (error: any) {
    console.error('[batchOperations] Erro no recálculo em lote:', error);
    return {
      success: false,
      message: `Erro no recálculo em lote: ${error.message}`
    };
  }
};
