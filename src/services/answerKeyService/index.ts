
import { getConsolidatedAnswerKey, getBookletAnswers } from './core';
import { saveBookletAnswerKey, updateSingleAnswer } from './save';
import { checkAnswerKeyCompleteness, getAnswerKeyStats } from './stats';
import { supabase } from '@/integrations/supabase/client';

// Serviço principal
const answerKeyService = {
  getConsolidatedAnswerKey,
  getBookletAnswers,
  saveBookletAnswerKey,
  updateSingleAnswer,
  checkAnswerKeyCompleteness,
  getAnswerKeyStats
};

// Funções auxiliares exportadas individualmente (para compatibilidade)
export const getAnswerKeyForBooklet = async (concursoId: string, bookletId: string) => {
  try {
    console.log('[getAnswerKeyForBooklet] Fetching answer key for concurso:', concursoId, 'booklet:', bookletId);
    
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData?.booklets?.[bookletId]) {
      console.log('[getAnswerKeyForBooklet] No data found for booklet:', bookletId);
      return { success: true, data: [] };
    }

    const bookletData = consolidatedData.booklets[bookletId];
    const answers = Object.entries(bookletData.answers || {}).map(([questionNum, answerData]: [string, any]) => ({
      question_number: parseInt(questionNum),
      correct_answer: answerData.correct_answer,
      weight: answerData.weight || 1.0,
      section_type: answerData.section_type,
      is_nullified: answerData.is_nullified || false,
      answer_format: answerData.answer_format || 'OBJECTIVE',
      question_type: answerData.question_type || 'MULTIPLE_CHOICE'
    }));

    console.log('[getAnswerKeyForBooklet] Found', answers.length, 'answers for booklet:', bookletId);
    return { success: true, data: answers };
  } catch (error: any) {
    console.error('[getAnswerKeyForBooklet] Error:', error);
    return { success: false, error: error.message };
  }
};

export const getAllBookletsAnswerKeys = async (concursoId: string) => {
  try {
    console.log('[getAllBookletsAnswerKeys] Fetching for concurso:', concursoId);
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData) {
      console.log('[getAllBookletsAnswerKeys] No consolidated data found');
      return { success: true, data: null };
    }

    console.log('[getAllBookletsAnswerKeys] Found consolidated data with', 
      Object.keys(consolidatedData.booklets || {}).length, 'booklets');
    return { success: true, data: consolidatedData };
  } catch (error: any) {
    console.error('[getAllBookletsAnswerKeys] Error:', error);
    return { success: false, error: error.message };
  }
};

// Função legada mantida para compatibilidade
export const saveBookletAnswerKeyLegacy = async (concursoId: string, bookletId: string, answersArray: any[]) => {
  try {
    console.log('[saveBookletAnswerKeyLegacy] Starting save for booklet:', bookletId);

    // 1. Fetch existing consolidated data for the concurso
    const { data: existingRecord, error: fetchError } = await supabase
      .from('official_answer_weights')
      .select('id, consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .maybeSingle();

    if (fetchError) {
      console.error('[saveBookletAnswerKeyLegacy] Error fetching existing data:', fetchError);
      return { success: false, error: fetchError.message };
    }

    let consolidatedData = existingRecord?.consolidated_answer_data || {
      booklets: {},
      metadata: { version: '1.0', created_at: new Date().toISOString() }
    };
    
    // Garantir que a estrutura exista
    if (typeof consolidatedData !== 'object' || consolidatedData === null) {
      consolidatedData = {
        booklets: {},
        metadata: { version: '1.0', created_at: new Date().toISOString() }
      };
    }
    if (!consolidatedData.booklets) {
      consolidatedData.booklets = {};
    }

    // 2. Format answers from array to object
    const formattedAnswers: Record<string, any> = {};
    answersArray.forEach((answer) => {
      const questionKey = answer.question_number.toString();
      formattedAnswers[questionKey] = {
        correct_answer: answer.correct_answer,
        weight: answer.weight || 1.0,
        section_type: answer.section_type,
        is_nullified: answer.is_nullified || false,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      };
    });

    // 3. Update the consolidated data object
    consolidatedData.booklets[bookletId] = {
        answers: formattedAnswers,
        metadata: {
            total_questions: Object.keys(formattedAnswers).length,
            last_updated: new Date().toISOString(),
            booklet_name: bookletId
        }
    };
    if (!consolidatedData.metadata) {
      consolidatedData.metadata = {};
    }
    consolidatedData.metadata.last_updated = new Date().toISOString();

    // 4. Update or Insert
    if (existingRecord) {
      // Update
      const { data, error } = await supabase
        .from('official_answer_weights')
        .update({ consolidated_answer_data: consolidatedData })
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      if (error) {
        console.error('[saveBookletAnswerKeyLegacy] Update Error:', error);
        return { success: false, error: error.message };
      }
      console.log('[saveBookletAnswerKeyLegacy] Update Success:', data);
      return { success: true, data };

    } else {
      // Insert
      const { data, error } = await supabase
        .from('official_answer_weights')
        .insert({
          concurso_id: concursoId,
          consolidated_answer_data: consolidatedData
        })
        .select()
        .single();

      if (error) {
        console.error('[saveBookletAnswerKeyLegacy] Insert Error:', error);
        return { success: false, error: error.message };
      }
      console.log('[saveBookletAnswerKeyLegacy] Insert Success:', data);
      return { success: true, data };
    }

  } catch (error: any) {
    console.error('[saveBookletAnswerKeyLegacy] Exception:', error);
    return { success: false, error: error.message };
  }
};

// Export the main service as default and named export
export default answerKeyService;
export { answerKeyService };

// Export individual functions for direct use
export { saveBookletAnswerKey, updateSingleAnswer, getConsolidatedAnswerKey, getBookletAnswers, checkAnswerKeyCompleteness, getAnswerKeyStats };
export * from './types';
