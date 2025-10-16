
import { supabase } from '@/integrations/supabase/client';
import { ConsolidatedAnswerKey } from './types';

export const getConsolidatedAnswerKey = async (concursoId: string): Promise<ConsolidatedAnswerKey | null> => {
  try {
    console.log('[getConsolidatedAnswerKey] Fetching consolidated answer key for concurso:', concursoId);
    
    const { data, error } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', concursoId)
      .single();

    if (error) {
      console.error('[getConsolidatedAnswerKey] Error fetching consolidated answer key:', error);
      return null;
    }

    if (!data?.official_answers) {
      console.log('[getConsolidatedAnswerKey] No official answers found for concurso:', concursoId);
      return null;
    }

    const officialAnswers = data.official_answers;
    
    // Validar estrutura dos dados
    if (!officialAnswers || typeof officialAnswers !== 'object') {
      console.warn('[getConsolidatedAnswerKey] Invalid official answers structure, initializing empty booklets');
      return {
        booklets: {},
        metadata: {
          version: '1.0',
          last_updated: new Date().toISOString()
        }
      };
    }

    console.log('[getConsolidatedAnswerKey] Found official answers with booklets:', Object.keys(officialAnswers));
    return { booklets: officialAnswers } as ConsolidatedAnswerKey;
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

    const answers = consolidatedData.booklets[bookletId].questions || {};
    console.log('[getBookletAnswers] Found', Object.keys(answers).length, 'answers for booklet:', bookletId);
    return answers;
  } catch (error) {
    console.error('[getBookletAnswers] Error:', error);
    return {};
  }
};
