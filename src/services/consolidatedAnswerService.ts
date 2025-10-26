// @ts-nocheck

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
  // Buscar dados consolidados de um usuário específico dentro do concurso
  async getConsolidatedAnswers(rankingId: string): Promise<ConsolidatedAnswerData | null> {
    try {
      // Debug logs removed for security
      
      // Buscar dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[consolidatedAnswerService] Usuário não autenticado');
        return null;
      }

      // Buscar dados consolidados usando user_id
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (rankingError || !rankingData) {
        console.error('[consolidatedAnswerService] Erro ao buscar ranking:', rankingError);
        return null;
      }

      // Verificar se há dados consolidados
      if (!rankingData.consolidated_data || rankingData.consolidated_data === '{}') {
        // Debug logs removed for security
        return null;
      }

      const consolidatedData = rankingData.consolidated_data;
      const userId = user.id;

      // Extrair dados usando a estrutura atual: rankings -> rankingId -> user_data
      const rankings = consolidatedData.rankings;
      if (!rankings) {
        // Debug logs removed for security
        return null;
      }

      // Encontrar o ranking específico pelo rankingId
      const specificRankingData = rankings[rankingId];
      if (!specificRankingData) {
        // Debug logs removed for security
        return null;
      }

      // Adaptar para a interface esperada (estrutura atual)
      const adaptedData: ConsolidatedAnswerData = {
        booklets: {}, // Estrutura de booklets não é mais usada
        subjective_scores: specificRankingData.user_data?.subjective_scores || {
          discursive: 0,
          case_study_1: 0,
          case_study_2: 0,
          case_study_3: 0,
          other_subjective: 0
        },
        selected_booklet: specificRankingData.selected_booklet_id || '',
        total_edit_count: specificRankingData.user_data?.edit_count || 0,
        metadata: {
          last_updated: specificRankingData.control_metadata?.last_updated || new Date().toISOString(),
          version: '3.0'
        }
      };
      
      // Debug logs removed for security
      
      return adaptedData;
    } catch (error) {
      console.error('[consolidatedAnswerService] Error:', error);
      return null;
    }
  },

      // Buscar respostas de um caderno específico (ISOLADO) - Estrutura atual
      async getBookletAnswers(rankingId: string, bookletId: string): Promise<{ [key: string]: string }> {
        try {
          // Debug logs removed for security

          const consolidatedData = await this.getConsolidatedAnswers(rankingId);

          // Na nova estrutura, as respostas estão em user_data.answers
          if (consolidatedData) {
            // Buscar dados do ranking específico
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return {};

            const { data: rankingData } = await supabase
              .from('user_rankings')
              .select('consolidated_data')
              .eq('user_id', user.id)
              .maybeSingle();

            if (rankingData?.consolidated_data?.rankings?.[rankingId]?.user_data?.answers) {
              const answers = rankingData.consolidated_data.rankings[rankingId].user_data.answers;
              // Debug logs removed for security
              return answers;
            }
          }

          console.log('[consolidatedAnswerService] Nenhuma resposta encontrada para o caderno:', bookletId);
          return {};
        } catch (error) {
          console.error('[consolidatedAnswerService] Error fetching booklet answers:', error);
          return {};
        }
      },

  // Trocar caderno (SIMPLIFICADO - apenas retorna as respostas do caderno)
  async switchBooklet(rankingId: string, bookletId: string): Promise<{ success: boolean; answers?: Record<string, string>; error?: string }> {
    try {
      // Debug logs removed for security
      
      // Buscar as respostas específicas do caderno
      const bookletAnswers = await this.getBookletAnswers(rankingId, bookletId);
      
      return {
        success: true,
        answers: bookletAnswers,
        error: undefined
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
      // console.log('[consolidatedAnswerService] Salvando respostas consolidadas via RPC');
      // console.log('[consolidatedAnswerService] Ranking ID:', rankingId);
      // console.log('[consolidatedAnswerService] Concurso ID:', concursoId);
      // console.log('[consolidatedAnswerService] Booklet ID:', bookletId);
      // console.log('[consolidatedAnswerService] Answers count:', answers.length);
      // console.log('[consolidatedAnswerService] Respostas a salvar:', answers);

      // Garantir que bookletId seja string
      const bookletIdString = String(bookletId);

      // Converter formato das respostas para a função consolidada
      const answersObject: { [key: string]: string } = {};
      answers.forEach(answer => {
        answersObject[answer.questionNumber.toString()] = answer.answer;
      });

        const { data, error } = await supabase.rpc('save_user_answers_v3', {
          p_ranking_id: rankingId,
          p_concurso_id: concursoId,
          p_booklet_id: bookletIdString,
          p_answers: answersObject,
          p_subjective_scores: {
            'discursive': discursiveScore,
            'case_study_1': caseStudy1Score,
            'case_study_2': caseStudy2Score,
            'case_study_3': caseStudy3Score
          },
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
