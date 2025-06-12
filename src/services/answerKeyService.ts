
import { supabase } from '@/integrations/supabase/client';

export interface AnswerKeyData {
  questionNumber: number;
  correctAnswer: string;
  weight: number;
  isNullified: boolean;
  sectionType: string;
}

export const answerKeyService = {
  // Buscar gabarito consolidado de um concurso
  async getConsolidatedAnswerKey(concursoId: string) {
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

      return data?.consolidated_answer_data || null;
    } catch (error) {
      console.error('[answerKeyService] Error:', error);
      return null;
    }
  },

  // Buscar respostas de um caderno específico
  async getBookletAnswers(concursoId: string, bookletId: string = 'default') {
    try {
      const consolidatedData = await this.getConsolidatedAnswerKey(concursoId);
      
      if (consolidatedData?.booklets?.[bookletId]) {
        return consolidatedData.booklets[bookletId].answers || {};
      }
      
      return {};
    } catch (error) {
      console.error('[answerKeyService] Error fetching booklet answers:', error);
      return {};
    }
  },

  // Salvar gabarito consolidado para um caderno
  async saveBookletAnswerKey(concursoId: string, bookletId: string, answers: Record<string, AnswerKeyData>) {
    try {
      console.log('[answerKeyService] Saving consolidated booklet answer key');
      console.log('[answerKeyService] Concurso ID:', concursoId);
      console.log('[answerKeyService] Booklet ID:', bookletId);
      console.log('[answerKeyService] Answers:', answers);

      // Converter o formato de answers para o formato esperado pela função RPC
      const formattedAnswers: Record<string, any> = {};
      
      Object.entries(answers).forEach(([questionNumber, answerData]) => {
        formattedAnswers[questionNumber] = {
          correct_answer: answerData.correctAnswer,
          weight: answerData.weight,
          section_type: answerData.sectionType,
          is_nullified: answerData.isNullified,
          answer_format: 'OBJECTIVE',
          question_type: 'MULTIPLE_CHOICE'
        };
      });

      const { data, error } = await supabase.rpc('save_consolidated_answer_key', {
        p_concurso_id: concursoId,
        p_booklet_id: bookletId,
        p_answers: formattedAnswers
      });

      if (error) {
        console.error('[answerKeyService] Error saving consolidated booklet answer key:', error);
        return { success: false, error: error.message };
      }

      console.log('[answerKeyService] Successfully saved consolidated answer key:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('[answerKeyService] Error in saveBookletAnswerKey:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar uma resposta específica
  async updateSingleAnswer(concursoId: string, questionNumber: number, answerData: AnswerKeyData) {
    try {
      console.log('[answerKeyService] Updating single answer');
      console.log('[answerKeyService] Question:', questionNumber, 'Answer:', answerData);

      const { data, error } = await supabase.rpc('update_answer_with_weight', {
        p_concurso_id: concursoId,
        p_question_number: questionNumber,
        p_correct_answer: answerData.correctAnswer,
        p_weight: answerData.weight,
        p_is_nullified: answerData.isNullified,
        p_section_type: answerData.sectionType
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
  },

  // Verificar completude do gabarito
  async checkAnswerKeyCompleteness(concursoId: string, bookletIds: string[], expectedQuestions: number) {
    try {
      console.log('[answerKeyService] Checking answer key completeness');
      
      const consolidatedData = await this.getConsolidatedAnswerKey(concursoId);
      
      if (!consolidatedData?.booklets) {
        return {
          allComplete: false,
          details: bookletIds.map(id => ({
            bookletId: id,
            bookletName: `Caderno ${id}`,
            completed: 0,
            total: expectedQuestions,
            isComplete: false
          }))
        };
      }

      const details = bookletIds.map(bookletId => {
        const booklet = consolidatedData.booklets[bookletId];
        const completed = booklet?.answers ? Object.keys(booklet.answers).length : 0;
        const isComplete = completed >= expectedQuestions;

        return {
          bookletId,
          bookletName: booklet?.metadata?.booklet_name || `Caderno ${bookletId}`,
          completed,
          total: expectedQuestions,
          isComplete
        };
      });

      const allComplete = details.every(detail => detail.isComplete);

      return {
        allComplete,
        details
      };
    } catch (error) {
      console.error('[answerKeyService] Error checking completeness:', error);
      return {
        allComplete: false,
        details: bookletIds.map(id => ({
          bookletId: id,
          bookletName: `Caderno ${id}`,
          completed: 0,
          total: expectedQuestions,
          isComplete: false
        }))
      };
    }
  },

  // Obter estatísticas do gabarito
  async getAnswerKeyStats(concursoId: string) {
    try {
      const consolidatedData = await this.getConsolidatedAnswerKey(concursoId);
      
      if (!consolidatedData?.booklets) {
        return {
          totalBooklets: 0,
          totalAnswers: 0,
          lastUpdated: null
        };
      }

      const booklets = consolidatedData.booklets;
      const totalBooklets = Object.keys(booklets).length;
      let totalAnswers = 0;

      Object.values(booklets).forEach((booklet: any) => {
        if (booklet.answers) {
          totalAnswers += Object.keys(booklet.answers).length;
        }
      });

      return {
        totalBooklets,
        totalAnswers,
        lastUpdated: consolidatedData.metadata?.last_updated || null
      };
    } catch (error) {
      console.error('[answerKeyService] Error getting stats:', error);
      return {
        totalBooklets: 0,
        totalAnswers: 0,
        lastUpdated: null
      };
    }
  }
};

// Funções auxiliares exportadas individualmente (para compatibilidade)
export const getAnswerKeyForBooklet = async (concursoId: string, bookletId: string) => {
  try {
    const consolidatedData = await answerKeyService.getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData?.booklets?.[bookletId]) {
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

    return { success: true, data: answers };
  } catch (error: any) {
    console.error('[getAnswerKeyForBooklet] Error:', error);
    return { success: false, error: error.message };
  }
};

export const saveBookletAnswerKey = async (concursoId: string, bookletId: string, answersArray: any[]) => {
  try {
    console.log('[saveBookletAnswerKey] Saving answer key for booklet:', bookletId);
    
    // Converter array para o formato esperado pela função RPC save_consolidated_answer_key
    const formattedAnswers: Record<string, any> = {};
    
    answersArray.forEach((answer) => {
      formattedAnswers[answer.question_number.toString()] = {
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
      p_booklet_id: bookletId,
      p_answers: formattedAnswers
    });

    if (error) {
      console.error('[saveBookletAnswerKey] Error:', error);
      return { success: false, error: error.message };
    }

    console.log('[saveBookletAnswerKey] Success:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[saveBookletAnswerKey] Error:', error);
    return { success: false, error: error.message };
  }
};

export const getAllBookletsAnswerKeys = async (concursoId: string) => {
  try {
    const consolidatedData = await answerKeyService.getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData) {
      return { success: true, data: null };
    }

    return { success: true, data: consolidatedData };
  } catch (error: any) {
    console.error('[getAllBookletsAnswerKeys] Error:', error);
    return { success: false, error: error.message };
  }
};

export default answerKeyService;
