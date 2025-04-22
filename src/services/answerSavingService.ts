
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';

export interface SaveAnswersParams {
  rankingId: string;
  concursoId: string;
  answers: { questionNumber: number; answer: string }[];
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  currentEditCount: number;
}

export interface SaveResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Serviço para salvar as respostas do usuário e recalcular pontuações
 */
export const answerSavingService = {
  /**
   * Salva as respostas do usuário e calcula a pontuação
   */
  async saveAnswersAndCalculateScores(params: SaveAnswersParams): Promise<SaveResult> {
    try {
      console.log('[answerSavingService] Iniciando salvamento com parâmetros:', {
        rankingId: params.rankingId,
        concursoId: params.concursoId,
        totalRespostas: params.answers.length,
        notasSubjetivas: {
          discursive: params.discursiveScore,
          caseStudy1: params.caseStudy1Score,
          caseStudy2: params.caseStudy2Score,
          caseStudy3: params.caseStudy3Score
        },
        editCount: params.currentEditCount
      });

      // Verificação do gabarito atual para fins de diagnóstico
      const { data: gabarito, error: gabaritoError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', params.concursoId);

      if (gabaritoError) {
        console.error('[answerSavingService] Erro ao buscar gabarito:', gabaritoError);
      } else {
        console.log('[answerSavingService] Gabarito encontrado:', {
          quantidadeQuestoes: gabarito?.length,
          questoesAnuladas: gabarito?.filter(q => q.is_nullified)?.length || 0
        });
      }

      // Chamada RPC para salvar respostas e calcular pontuações
      const { data, error } = await supabase.rpc('save_user_answers_and_calculate_scores', {
        p_ranking_id: params.rankingId,
        p_concurso_id: params.concursoId,
        p_answers: params.answers,
        p_discursive_score: params.discursiveScore || 0,
        p_case_study_1_score: params.caseStudy1Score || 0,
        p_case_study_2_score: params.caseStudy2Score || 0,
        p_case_study_3_score: params.caseStudy3Score || 0,
        p_current_edit_count: params.currentEditCount
      });

      if (error) {
        console.error('[answerSavingService] Erro na função RPC:', error);
        return {
          success: false,
          error: error.message || "Erro ao salvar respostas"
        };
      }

      console.log('[answerSavingService] Resposta da função RPC:', data);

      if (!data.success) {
        return {
          success: false,
          error: data.error || "Erro ao salvar respostas"
        };
      }

      // Verificar estado do ranking após salvamento
      const { data: rankingAtual, error: rankingError } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('id', params.rankingId)
        .single();

      if (rankingError) {
        console.error('[answerSavingService] Erro ao buscar ranking atualizado:', rankingError);
      } else {
        console.log('[answerSavingService] Estado final do ranking:', {
          id: rankingAtual.id,
          pontuacaoBasica: rankingAtual.basic_knowledge_score,
          pontuacaoEspecifica: rankingAtual.specific_knowledge_score,
          pontuacaoTotal: rankingAtual.score,
          contadorEdicoes: rankingAtual.edit_count
        });
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('[answerSavingService] Erro não tratado:', error);
      return {
        success: false,
        error: error.message || "Erro interno ao salvar respostas"
      };
    }
  },

  /**
   * Verifica quantas edições o usuário já fez
   */
  async getEditCount(rankingId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('edit_count')
        .eq('id', rankingId)
        .single();

      if (error) {
        console.error('[answerSavingService] Erro ao buscar contador de edições:', error);
        return 0;
      }

      return data?.edit_count || 0;
    } catch (error) {
      console.error('[answerSavingService] Erro ao verificar contador de edições:', error);
      return 0;
    }
  }
};
