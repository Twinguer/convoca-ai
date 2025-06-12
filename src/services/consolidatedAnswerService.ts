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
      console.log('[consolidatedAnswerService] Buscando dados consolidados para ranking:', rankingId);
      
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

      const consolidatedData = data?.answers_data as ConsolidatedAnswerData || null;
      console.log('[consolidatedAnswerService] Dados consolidados encontrados:', consolidatedData);
      
      return consolidatedData;
    } catch (error) {
      console.error('[consolidatedAnswerService] Error:', error);
      return null;
    }
  },

  // Buscar respostas de um caderno específico (ISOLADO)
  async getBookletAnswers(rankingId: string, bookletId: string): Promise<{ [key: string]: string }> {
    try {
      console.log('[consolidatedAnswerService] Buscando respostas do caderno:', bookletId, 'para ranking:', rankingId);
      
      const consolidatedData = await this.getConsolidatedAnswers(rankingId);
      
      if (consolidatedData?.booklets?.[bookletId]) {
        const bookletData = consolidatedData.booklets[bookletId] as BookletData;
        console.log('[consolidatedAnswerService] Respostas do caderno encontradas:', bookletData.answers);
        return bookletData.answers || {};
      }
      
      console.log('[consolidatedAnswerService] Nenhuma resposta encontrada para o caderno:', bookletId);
      return {};
    } catch (error) {
      console.error('[consolidatedAnswerService] Error fetching booklet answers:', error);
      return {};
    }
  },

  // Trocar caderno (CORRIGIDO para limpar estado anterior)
  async switchBooklet(rankingId: string, bookletId: string): Promise<{ success: boolean; answers?: Record<string, string>; error?: string }> {
    try {
      console.log('[consolidatedAnswerService] Trocando para caderno:', bookletId, 'ranking:', rankingId);
      
      const { data, error } = await supabase.rpc('switch_user_booklet', {
        p_ranking_id: rankingId,
        p_booklet_id: bookletId
      });

      if (error) {
        console.error('[consolidatedAnswerService] Switch booklet error:', error);
        return { success: false, error: error.message };
      }

      console.log('[consolidatedAnswerService] Switch response:', data);
      
      // Buscar as respostas específicas do novo caderno
      const bookletAnswers = await this.getBookletAnswers(rankingId, bookletId);
      
      return {
        success: data?.success || false,
        answers: bookletAnswers,
        error: data?.success ? undefined : 'Falha ao trocar caderno'
      };
    } catch (error: any) {
      console.error('[consolidatedAnswerService] Error switching booklet:', error);
      return { success: false, error: error.message };
    }
  },

  // Salvar respostas usando a função RPC consolidada (CORRIGIDA PARA SALVAR POR CADERNO)
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
      console.log('[consolidatedAnswerService] Salvando respostas consolidadas via RPC');
      console.log('[consolidatedAnswerService] Ranking ID:', rankingId);
      console.log('[consolidatedAnswerService] Concurso ID:', concursoId);
      console.log('[consolidatedAnswerService] Booklet ID:', bookletId);
      console.log('[consolidatedAnswerService] Answers count:', answers.length);
      console.log('[consolidatedAnswerService] Respostas a salvar:', answers);

      const { data, error } = await supabase.rpc('save_user_answers_with_booklet', {
        p_ranking_id: rankingId,
        p_concurso_id: concursoId,
        p_booklet_id: bookletId,
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

      console.log('[consolidatedAnswerService] RPC Response:', data);
      
      return data;
    } catch (error: any) {
      console.error('[consolidatedAnswerService] Error saving consolidated answers:', error);
      return { success: false, error: error.message };
    }
  },

  // Obter estatísticas de resposta por caderno
  async getAnswerStatsByBooklet(rankingId: string) {
    try {
      const consolidatedData = await this.getConsolidatedAnswers(rankingId);
      
      if (!consolidatedData) {
        return {
          totalAnswers: 0,
          bookletCount: 0,
          editCount: 0,
          lastUpdated: null,
          selectedBooklet: null,
          bookletStats: {}
        };
      }

      let totalAnswers = 0;
      const bookletCount = Object.keys(consolidatedData.booklets || {}).length;
      const bookletStats: Record<string, { answerCount: number; bookletName?: string; lastUpdate?: string }> = {};

      // Calcular estatísticas por caderno
      if (consolidatedData.booklets) {
        Object.entries(consolidatedData.booklets).forEach(([bookletId, booklet]) => {
          const bookletData = booklet as BookletData;
          const answerCount = bookletData.answers ? Object.keys(bookletData.answers).length : 0;
          totalAnswers += answerCount;
          
          bookletStats[bookletId] = {
            answerCount,
            bookletName: bookletData.metadata?.booklet_name,
            lastUpdate: bookletData.metadata?.completed_at
          };
        });
      }

      return {
        totalAnswers,
        bookletCount,
        editCount: consolidatedData.total_edit_count || 0,
        lastUpdated: consolidatedData.metadata?.last_updated || null,
        selectedBooklet: consolidatedData.selected_booklet || null,
        bookletStats
      };
    } catch (error) {
      console.error('[consolidatedAnswerService] Error getting stats:', error);
      return {
        totalAnswers: 0,
        bookletCount: 0,
        editCount: 0,
        lastUpdated: null,
        selectedBooklet: null,
        bookletStats: {}
      };
    }
  },

  // Obter estatísticas de resposta (método legado)
  async getAnswerStats(rankingId: string) {
    const stats = await this.getAnswerStatsByBooklet(rankingId);
    return {
      totalAnswers: stats.totalAnswers,
      bookletCount: stats.bookletCount,
      editCount: stats.editCount,
      lastUpdated: stats.lastUpdated
    };
  }
};

export default consolidatedAnswerService;
