
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
    console.log('[saveBookletAnswerKey] Starting save for booklet:', bookletId);
    
    const bookletIdString = String(bookletId);
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

    const { data, error } = await supabase.rpc('save_consolidated_answer_key', {
      p_concurso_id: concursoId,
      p_booklet_id: bookletIdString,
      p_answers: formattedAnswers
    });

    if (error) {
      console.error('[saveBookletAnswerKey] RPC Error:', error);
      return { success: false, error: error.message };
    }

    console.log('[saveBookletAnswerKey] RPC Success:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[saveBookletAnswerKey] Exception:', error);
    return { success: false, error: error.message };
  }
};

// Export the main service as default and named export
export default answerKeyService;
export { answerKeyService };

// Export individual functions for direct use
export { saveBookletAnswerKey, updateSingleAnswer, getConsolidatedAnswerKey, getBookletAnswers, checkAnswerKeyCompleteness, getAnswerKeyStats };
export * from './types';
