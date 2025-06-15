
import { supabase } from '@/integrations/supabase/client';
import { ConsolidatedAnswerKey } from './types';

export const getConsolidatedAnswerKey = async (concursoId: string): Promise<ConsolidatedAnswerKey | null> => {
  try {
    console.log('[getConsolidatedAnswerKey] Fetching consolidated answer key for concurso:', concursoId);
    
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
      console.log('[getConsolidatedAnswerKey] No consolidated data found for concurso:', concursoId);
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

    console.log('[getConsolidatedAnswerKey] Found consolidated data with booklets:', Object.keys(consolidatedData.booklets));
    return consolidatedData as ConsolidatedAnswerKey;
  } catch (error) {
    console.error('[getConsolidatedAnswerKey] Exception:', error);
    return null;
  }
};

export const getBookletAnswers = async (concursoId: string, bookletId: string) => {
  try {
    console.log('[getBookletAnswers] Getting answers for concurso:', concursoId, 'booklet:', bookletId);
    
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData?.booklets?.[bookletId]) {
      console.log('[getBookletAnswers] No answers found for booklet:', bookletId);
      return {};
    }

    const answers = consolidatedData.booklets[bookletId].answers || {};
    console.log('[getBookletAnswers] Found', Object.keys(answers).length, 'answers for booklet:', bookletId);
    return answers;
  } catch (error) {
    console.error('[getBookletAnswers] Error:', error);
    return {};
  }
};
