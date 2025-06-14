
import { supabase } from '@/integrations/supabase/client';
import { ConsolidatedAnswerKey } from './types';

export const getConsolidatedAnswerKey = async (concursoId: string): Promise<ConsolidatedAnswerKey | null> => {
  try {
    console.log('[answerKeyService] Fetching consolidated answer key for concurso:', concursoId);
    
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .single();

    if (error) {
      console.error('[answerKeyService] Error fetching consolidated answer key:', error);
      return null;
    }

    console.log('[answerKeyService] Consolidated data found:', data?.consolidated_answer_data ? 'Yes' : 'No');
    return data?.consolidated_answer_data || null;
  } catch (error) {
    console.error('[answerKeyService] Error:', error);
    return null;
  }
};

export const getBookletAnswers = async (concursoId: string, bookletId: string = 'default') => {
  try {
    console.log('[answerKeyService] Getting booklet answers for:', { concursoId, bookletId });
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (consolidatedData?.booklets?.[bookletId]) {
      const answers = consolidatedData.booklets[bookletId].answers || {};
      console.log('[answerKeyService] Found', Object.keys(answers).length, 'answers for booklet:', bookletId);
      return answers;
    }
    
    console.log('[answerKeyService] No answers found for booklet:', bookletId);
    return {};
  } catch (error) {
    console.error('[answerKeyService] Error fetching booklet answers:', error);
    return {};
  }
};
