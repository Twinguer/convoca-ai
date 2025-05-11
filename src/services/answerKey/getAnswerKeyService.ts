
import { supabase } from '@/integrations/supabase/client';
import { answerKeyLogger as logger } from './answerKeyLogger';
import { GetAnswerKeyResult } from './types';

/**
 * Função para obter o gabarito de um concurso
 */
export const getAnswerKey = async (concursoId: string): Promise<GetAnswerKeyResult> => {
  try {
    logger.info(`Buscando gabarito do concurso: ${concursoId}`);
    
    const { data, error } = await supabase.rpc('get_official_answer_weights', {
      p_concurso_id: concursoId
    });

    if (error) {
      logger.error('Erro ao buscar gabarito:', error);
      throw error;
    }

    logger.debug(`Gabarito encontrado:`, data);
    return {
      success: true,
      data: data || {}
    };
  } catch (error) {
    logger.error('Erro ao buscar gabarito:', error);
    return {
      success: false,
      error: (error as Error).message,
      data: {}
    };
  }
};
