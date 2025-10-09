
import { supabase } from '@/integrations/supabase/client';
import { ConsolidatedAnswerKey } from './types';

export const getConsolidatedAnswerKey = async (concursoId: string): Promise<ConsolidatedAnswerKey | null> => {
  try {
    // Log removido por segurança
    
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .maybeSingle();

    if (error) {
      console.error('[getConsolidatedAnswerKey] Error fetching consolidated answer key:', error);
      return null;
    }

    if (!data?.consolidated_answer_data) {
      // Log removido por segurança
      return null;
    }

    const consolidatedData = data.consolidated_answer_data;
    
    // Validar estrutura dos dados
    if (!consolidatedData.booklets || typeof consolidatedData.booklets !== 'object') {
      console.warn('[getConsolidatedAnswerKey] Invalid booklets structure, initializing empty booklets');
      return {
        booklets: {},
        metadata: {
          version: '1.0',
          last_updated: new Date().toISOString()
        }
      };
    }

    // Log removido por segurança
    return consolidatedData as ConsolidatedAnswerKey;
  } catch (error) {
    console.error('[getConsolidatedAnswerKey] Exception:', error);
    return null;
  }
};

export const getBookletAnswers = async (concursoId: string, bookletId: string) => {
  try {
    // Log removido por segurança
    
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData?.booklets?.[bookletId]) {
      // Log removido por segurança
      return {};
    }

    const answers = consolidatedData.booklets[bookletId].answers || {};
    // Log removido por segurança
    return answers;
  } catch (error) {
    console.error('[getBookletAnswers] Error:', error);
    return {};
  }
};
