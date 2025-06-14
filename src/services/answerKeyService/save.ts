
import { supabase } from '@/integrations/supabase/client';
import { AnswerKeyData } from './types';

export const saveBookletAnswerKey = async (
  concursoId: string, 
  bookletId: string, 
  answers: Record<string, AnswerKeyData>
) => {
  try {
    console.log('[answerKeyService] Starting saveBookletAnswerKey');
    console.log('[answerKeyService] Concurso ID:', concursoId);
    console.log('[answerKeyService] Booklet ID (input):', bookletId, 'Type:', typeof bookletId);
    console.log('[answerKeyService] Input answers structure:', Object.keys(answers));

    // Garantir que bookletId seja sempre string
    const bookletIdString = String(bookletId);
    console.log('[answerKeyService] Booklet ID (converted to string):', bookletIdString);

    // Converter o formato de answers para o formato esperado pela função RPC
    const formattedAnswers: Record<string, any> = {};
    
    Object.entries(answers).forEach(([questionNumber, answerData]) => {
      console.log(`[answerKeyService] Processing question ${questionNumber}:`, answerData);
      
      formattedAnswers[questionNumber] = {
        correct_answer: answerData.correctAnswer,
        weight: answerData.weight,
        section_type: answerData.sectionType,
        is_nullified: answerData.isNullified,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      };
    });

    console.log('[answerKeyService] Formatted answers for RPC:', formattedAnswers);
    console.log('[answerKeyService] Total questions to save:', Object.keys(formattedAnswers).length);

    const { data, error } = await supabase.rpc('save_consolidated_answer_key', {
      p_concurso_id: concursoId,
      p_booklet_id: bookletIdString,
      p_answers: formattedAnswers
    });

    if (error) {
      console.error('[answerKeyService] RPC Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error: error.message };
    }

    console.log('[answerKeyService] RPC Success response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[answerKeyService] Exception in saveBookletAnswerKey:', error);
    return { success: false, error: error.message };
  }
};

export const updateSingleAnswer = async (
  concursoId: string, 
  questionNumber: number, 
  answerData: AnswerKeyData
) => {
  try {
    console.log('[answerKeyService] Updating single answer');
    console.log('[answerKeyService] Question:', questionNumber, 'Answer:', answerData);

    // Como não temos mais a função update_answer_with_weight que usava booklet_id,
    // vamos usar a função consolidada para atualizar uma única resposta
    const singleAnswerData = {
      [questionNumber.toString()]: {
        correct_answer: answerData.correctAnswer,
        weight: answerData.weight,
        section_type: answerData.sectionType,
        is_nullified: answerData.isNullified,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      }
    };

    const { data, error } = await supabase.rpc('save_consolidated_answer_key', {
      p_concurso_id: concursoId,
      p_booklet_id: 'default', // Usar um booklet padrão para atualizações individuais
      p_answers: singleAnswerData
    });

    if (error) {
      console.error('[answerKeyService] Error updating single answer:', error);
      return { success: false, error: error.message };
    }

    console.log('[answerKeyService] Successfully updated answer:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[answerKeyService] Error in updateSingleAnswer:', error);
    return { success: false, error: error.message };
  }
};
