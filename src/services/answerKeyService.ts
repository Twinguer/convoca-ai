
import { supabase } from '@/integrations/supabase/client';

export const answerKeyService = {
  async saveAnswerKey(concursoId: string, answers: Record<string, any>) {
    console.log('[answerKeyService] Saving answer key for concurso:', concursoId);
    
    try {
      // Convert answers to the new JSON structure format
      const answersData = Object.entries(answers).reduce((acc, [questionKey, answerData]) => {
        const questionNumber = parseInt(questionKey.replace('questao', ''));
        
        acc[questionNumber.toString()] = {
          correct_answer: answerData.resposta,
          explanation: answerData.explicacao || null,
          weight: answerData.peso || 1,
          section_type: answerData.secao || 'basic',
          is_nullified: answerData.anulada || false,
          answer_format: 'OBJECTIVE',
          question_type: 'MULTIPLE_CHOICE'
        };
        
        return acc;
      }, {} as Record<string, any>);

      console.log('[answerKeyService] Converted answers data:', answersData);

      // Use consolidated save function with default booklet
      const { data, error } = await supabase.rpc('save_consolidated_answer_key', {
        p_concurso_id: concursoId,
        p_booklet_id: 'default',
        p_answers: answersData
      });

      if (error) {
        console.error('[answerKeyService] Error saving consolidated answer key:', error);
        throw error;
      }

      console.log('[answerKeyService] Answer key saved successfully');
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('[answerKeyService] Error in saveAnswerKey:', error);
      throw error;
    }
  },

  async getAnswerKey(concursoId: string, bookletId?: string) {
    console.log('[answerKeyService] Fetching answer key for concurso:', concursoId, 'booklet:', bookletId);
    
    try {
      const { data, error } = await supabase.rpc('get_consolidated_answer_key', {
        p_concurso_id: concursoId
      });

      if (error) {
        console.error('[answerKeyService] Error fetching consolidated answer key:', error);
        throw error;
      }

      // Transform consolidated data back to legacy format for compatibility
      const transformedData: Record<string, any> = {};
      
      if (data?.booklets) {
        const targetBookletId = bookletId || Object.keys(data.booklets)[0];
        const bookletData = data.booklets[targetBookletId];
        
        if (bookletData?.answers) {
          Object.entries(bookletData.answers).forEach(([questionNum, answerData]: [string, any]) => {
            const questionKey = `questao${questionNum}`;
            transformedData[questionKey] = {
              resposta: answerData.correct_answer,
              peso: answerData.weight || 1,
              secao: answerData.section_type || 'basic',
              anulada: answerData.is_nullified || false,
              explicacao: answerData.explanation || null
            };
          });
        }
      }

      console.log('[answerKeyService] Transformed answer key fetched successfully');
      return transformedData;
    } catch (error) {
      console.error('[answerKeyService] Error in getAnswerKey:', error);
      throw error;
    }
  },

  async saveBookletAnswerKey(concursoId: string, bookletId: string, answers: any[]) {
    console.log('[answerKeyService] Saving booklet answer key for concurso:', concursoId, 'booklet:', bookletId);
    
    try {
      // Convert array format to JSON object format
      const answersData = answers.reduce((acc, answer) => {
        acc[answer.question_number.toString()] = {
          correct_answer: answer.correct_answer,
          weight: answer.weight || 1.0,
          section_type: answer.section_type,
          is_nullified: answer.is_nullified || false,
          answer_format: 'OBJECTIVE',
          question_type: 'MULTIPLE_CHOICE'
        };
        return acc;
      }, {} as Record<string, any>);

      console.log('[answerKeyService] Converted booklet answers data:', answersData);

      // Use the corrected consolidated save function
      const { data, error } = await supabase.rpc('save_consolidated_answer_key', {
        p_concurso_id: concursoId,
        p_booklet_id: bookletId,
        p_answers: answersData
      });

      if (error) {
        console.error('[answerKeyService] Error saving consolidated booklet answer key:', error);
        throw error;
      }

      console.log('[answerKeyService] Booklet answer key saved successfully');
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('[answerKeyService] Error in saveBookletAnswerKey:', error);
      return { success: false, error: error.message };
    }
  },

  async getAnswerKeyForBooklet(concursoId: string, bookletId: string) {
    console.log('[answerKeyService] Fetching answer key for concurso:', concursoId, 'booklet:', bookletId);
    
    try {
      const { data, error } = await supabase.rpc('get_consolidated_answer_key', {
        p_concurso_id: concursoId
      });

      if (error) {
        console.error('[answerKeyService] Error fetching consolidated answer key:', error);
        throw error;
      }

      // Extract specific booklet data
      const bookletData = data?.booklets?.[bookletId];
      if (!bookletData) {
        console.log('[answerKeyService] No data found for booklet:', bookletId);
        return { success: true, data: [] };
      }

      // Convert to array format expected by the component
      const answersArray = Object.entries(bookletData.answers || {}).map(([questionNum, answerData]: [string, any]) => ({
        question_number: parseInt(questionNum),
        correct_answer: answerData.correct_answer,
        weight: answerData.weight || 1.0,
        section_type: answerData.section_type,
        is_nullified: answerData.is_nullified || false,
        answer_format: answerData.answer_format || 'OBJECTIVE',
        question_type: answerData.question_type || 'MULTIPLE_CHOICE'
      }));

      console.log('[answerKeyService] Booklet answer key fetched successfully');
      return { success: true, data: answersArray };
    } catch (error) {
      console.error('[answerKeyService] Error in getAnswerKeyForBooklet:', error);
      return { success: false, error: error.message };
    }
  },

  // New method to get all booklets answer keys for a concurso
  async getAllBookletsAnswerKeys(concursoId: string) {
    console.log('[answerKeyService] Fetching all booklets answer keys for concurso:', concursoId);
    
    try {
      const { data, error } = await supabase.rpc('get_consolidated_answer_key', {
        p_concurso_id: concursoId
      });

      if (error) {
        console.error('[answerKeyService] Error fetching consolidated answer key:', error);
        throw error;
      }

      console.log('[answerKeyService] All booklets answer keys fetched successfully');
      return { success: true, data: data || {} };
    } catch (error) {
      console.error('[answerKeyService] Error in getAllBookletsAnswerKeys:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export individual functions for easier importing
export const { saveAnswerKey, getAnswerKey, saveBookletAnswerKey, getAnswerKeyForBooklet, getAllBookletsAnswerKeys } = answerKeyService;
