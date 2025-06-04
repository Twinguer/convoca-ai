
import { supabase } from '@/integrations/supabase/client';

// Interface para trabalhar com a estrutura consolidada
interface ConsolidatedAnswerData {
  booklets: {
    [bookletId: string]: {
      answers: { [questionNumber: string]: string };
      metadata: {
        completed_at: string;
        answer_count: number;
        booklet_name?: string;
      };
    };
  };
  subjective_scores: {
    discursive: number;
    case_study_1: number;
    case_study_2: number;
    case_study_3: number;
  };
  selected_booklet: string;
  total_edit_count: number;
  metadata: {
    last_updated: string;
    version: string;
  };
}

interface BookletData {
  answers: { [questionNumber: string]: string };
  metadata: {
    completed_at: string;
    answer_count: number;
    booklet_name?: string;
  };
}

export const consolidatedAnswerService = {
  // Buscar dados consolidados de um ranking
  async getConsolidatedAnswers(rankingId: string): Promise<ConsolidatedAnswerData | null> {
    try {
      const { data, error } = await supabase
        .from('user_answers')
        .select('answers_data')
        .eq('user_ranking_id', rankingId)
        .is('question_number', null)
        .single();

      if (error) {
        console.error('[consolidatedAnswerService] Error fetching data:', error);
        return null;
      }

      return data?.answers_data as ConsolidatedAnswerData || null;
    } catch (error) {
      console.error('[consolidatedAnswerService] Error:', error);
      return null;
    }
  },

  // Buscar respostas de um caderno específico
  async getBookletAnswers(rankingId: string, bookletId: string): Promise<{ [key: string]: string }> {
    try {
      console.log('[consolidatedAnswerService] Fetching booklet answers for:', { rankingId, bookletId });
      
      const { data, error } = await supabase.rpc('get_booklet_answers', {
        p_ranking_id: rankingId,
        p_booklet_id: bookletId
      });
      
      if (error) {
        console.error('[consolidatedAnswerService] Error fetching booklet answers:', error);
        return {};
      }
      
      console.log('[consolidatedAnswerService] Booklet answers:', data);
      return data || {};
    } catch (error) {
      console.error('[consolidatedAnswerService] Error fetching booklet answers:', error);
      return {};
    }
  },

  // Listar todos os cadernos com respostas de um usuário
  async getUserBookletsWithAnswers(rankingId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_booklets_with_answers', {
        p_ranking_id: rankingId
      });
      
      if (error) {
        console.error('[consolidatedAnswerService] Error fetching user booklets:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[consolidatedAnswerService] Error fetching user booklets:', error);
      return [];
    }
  },

  // Salvar respostas usando a função RPC consolidada (ATUALIZADA PARA UUID)
  async saveConsolidatedAnswers(
    rankingId: string,
    concursoId: string,
    bookletId: string,
    answers: { questionNumber: number; answer: string; sectionType?: string; bookletId?: string; answerData?: any }[],
    discursiveScore = 0,
    caseStudy1Score = 0,
    caseStudy2Score = 0,
    caseStudy3Score = 0,
    editCount = 0
  ) {
    try {
      console.log('[consolidatedAnswerService] Saving consolidated answers for booklet:', bookletId);
      console.log('[consolidatedAnswerService] Total answers:', answers.length);
      
      const { data, error } = await supabase.rpc('save_user_answers_with_booklet', {
        p_ranking_id: rankingId,
        p_concurso_id: concursoId,
        p_booklet_id: bookletId, // UUID do caderno específico
        p_answers: answers,
        p_discursive_score: discursiveScore,
        p_case_study_1_score: caseStudy1Score,
        p_case_study_2_score: caseStudy2Score,
        p_case_study_3_score: caseStudy3Score,
        p_current_edit_count: editCount
      });

      if (error) {
        console.error('[consolidatedAnswerService] RPC Error:', error);
        return { success: false, error: error.message };
      }

      console.log('[consolidatedAnswerService] Successfully saved for booklet:', bookletId);
      console.log('[consolidatedAnswerService] RPC Response:', data);
      return data;
    } catch (error: any) {
      console.error('[consolidatedAnswerService] Error saving consolidated answers:', error);
      return { success: false, error: error.message };
    }
  },

  // Obter estatísticas de resposta
  async getAnswerStats(rankingId: string) {
    try {
      const consolidatedData = await this.getConsolidatedAnswers(rankingId);
      
      if (!consolidatedData) {
        return {
          totalAnswers: 0,
          bookletCount: 0,
          editCount: 0,
          lastUpdated: null,
          bookletBreakdown: {}
        };
      }

      let totalAnswers = 0;
      const bookletCount = Object.keys(consolidatedData.booklets || {}).length;
      const bookletBreakdown: { [key: string]: number } = {};

      // Calcular total de respostas por caderno
      if (consolidatedData.booklets) {
        Object.entries(consolidatedData.booklets).forEach(([bookletId, booklet]) => {
          const bookletData = booklet as BookletData;
          if (bookletData.answers) {
            const answerCount = Object.keys(bookletData.answers).length;
            totalAnswers += answerCount;
            bookletBreakdown[bookletId] = answerCount;
          }
        });
      }

      return {
        totalAnswers,
        bookletCount,
        editCount: consolidatedData.total_edit_count || 0,
        lastUpdated: consolidatedData.metadata?.last_updated || null,
        selectedBooklet: consolidatedData.selected_booklet || null,
        bookletBreakdown
      };
    } catch (error) {
      console.error('[consolidatedAnswerService] Error getting stats:', error);
      return {
        totalAnswers: 0,
        bookletCount: 0,
        editCount: 0,
        lastUpdated: null,
        bookletBreakdown: {}
      };
    }
  }
};

export default consolidatedAnswerService;
