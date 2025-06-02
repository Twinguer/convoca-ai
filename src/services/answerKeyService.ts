
import { supabase } from '@/integrations/supabase/client';

export const answerKeyService = {
  async saveAnswerKey(concursoId: string, answers: Record<string, any>) {
    console.log('[answerKeyService] Saving answer key for concurso:', concursoId);
    
    try {
      // Delete existing answer keys for this concurso
      const { error: deleteError } = await supabase
        .from('official_answer_weights')
        .delete()
        .eq('concurso_id', concursoId);

      if (deleteError) {
        console.error('[answerKeyService] Error deleting existing answers:', deleteError);
        throw deleteError;
      }

      // Prepare new answer key data using JSONB structure
      const answerKeyData = Object.entries(answers).map(([questionKey, answerData]) => {
        const questionNumber = parseInt(questionKey.replace('questao', ''));
        
        return {
          concurso_id: concursoId,
          question_number: questionNumber,
          correct_answer: answerData.resposta, // Keep for compatibility
          answer_data: {
            correct_answer: answerData.resposta,
            explanation: answerData.explicacao || null
          },
          weight: answerData.peso || 1,
          section_type: answerData.secao || 'basic',
          is_nullified: answerData.anulada || false,
          answer_format: 'OBJECTIVE',
          question_type: 'MULTIPLE_CHOICE'
        };
      });

      console.log('[answerKeyService] Inserting answer key data:', answerKeyData);

      // Insert new answer keys
      const { data, error } = await supabase
        .from('official_answer_weights')
        .insert(answerKeyData)
        .select();

      if (error) {
        console.error('[answerKeyService] Error inserting answer keys:', error);
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
      let query = supabase
        .from('official_answer_weights')
        .select('*')
        .eq('concurso_id', concursoId)
        .order('question_number');

      if (bookletId) {
        query = query.eq('booklet_id', bookletId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[answerKeyService] Error fetching answer key:', error);
        throw error;
      }

      // Transform data to use JSONB structure with fallback
      const transformedData = (data || []).reduce((acc: Record<string, any>, item: any) => {
        const questionKey = `questao${item.question_number}`;
        
        // Use JSONB structure with fallback to old columns
        const correctAnswer = item.answer_data?.correct_answer || item.correct_answer;
        const explanation = item.answer_data?.explanation || null;
        
        acc[questionKey] = {
          resposta: correctAnswer,
          peso: item.weight || 1,
          secao: item.section_type || 'basic',
          anulada: item.is_nullified || false,
          explicacao: explanation
        };
        
        return acc;
      }, {});

      console.log('[answerKeyService] Answer key fetched successfully');
      return transformedData;
    } catch (error) {
      console.error('[answerKeyService] Error in getAnswerKey:', error);
      throw error;
    }
  },

  async saveBookletAnswerKey(concursoId: string, bookletId: string, answers: any[]) {
    console.log('[answerKeyService] Saving booklet answer key for concurso:', concursoId, 'booklet:', bookletId);
    
    try {
      // Delete existing answer keys for this concurso and booklet
      const { error: deleteError } = await supabase
        .from('official_answer_weights')
        .delete()
        .eq('concurso_id', concursoId)
        .eq('booklet_id', bookletId);

      if (deleteError) {
        console.error('[answerKeyService] Error deleting existing booklet answers:', deleteError);
        throw deleteError;
      }

      console.log('[answerKeyService] Inserting booklet answer key data:', answers);

      // Insert new answer keys directly from the array format
      const { data, error } = await supabase
        .from('official_answer_weights')
        .insert(answers)
        .select();

      if (error) {
        console.error('[answerKeyService] Error inserting booklet answer keys:', error);
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
      const { data, error } = await supabase
        .from('official_answer_weights')
        .select('*')
        .eq('concurso_id', concursoId)
        .eq('booklet_id', bookletId)
        .order('question_number');

      if (error) {
        console.error('[answerKeyService] Error fetching booklet answer key:', error);
        throw error;
      }

      console.log('[answerKeyService] Booklet answer key fetched successfully');
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('[answerKeyService] Error in getAnswerKeyForBooklet:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export individual functions for easier importing
export const { saveAnswerKey, getAnswerKey, saveBookletAnswerKey, getAnswerKeyForBooklet } = answerKeyService;
