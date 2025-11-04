// @ts-nocheck

/**
 * SERVIÇO OTIMIZADO PARA USER_RANKINGS
 * 
 * Este serviço foi projetado para trabalhar com a nova estrutura JSONB
 * otimizada da tabela user_rankings, oferecendo:
 * 
 * 1. Performance superior
 * 2. Consultas mais eficientes
 * 3. Melhor organização dos dados
 * 4. Facilidade de manutenção
 * 5. Suporte completo às regras de negócio
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  ConsolidatedUserRankings, 
  UserRankingData, 
  RankingSummary, 
  QuotaRanking,
  QuotaType,
  RankingStatus 
} from '@/types/userRankings';

export class OptimizedUserRankingsService {
  
  // ============================================================================
  // MÉTODOS DE BUSCA E CONSULTA
  // ============================================================================
  
  /**
   * Busca todos os rankings de um usuário
   */
  static async getUserRankings(userId: string): Promise<ConsolidatedUserRankings | null> {
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.consolidated_data || null;
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error fetching user rankings:', error);
      return null;
    }
  }
  
  /**
   * Busca ranking específico de um usuário em um concurso
   */
  static async getUserRankingByConcurso(userId: string, concursoId: string): Promise<UserRankingData | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_ranking_by_concurso', {
        p_user_id: userId,
        p_concurso_id: concursoId
      });
      
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error fetching user ranking by concurso:', error);
      return null;
    }
  }
  
  /**
   * Busca todos os rankings de um concurso
   */
  static async getConcursoRankings(concursoId: string): Promise<Array<{
    user_id: string;
    ranking_id: string;
    ranking_data: UserRankingData;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_concurso_rankings', {
        p_concurso_id: concursoId
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error fetching concurso rankings:', error);
      return [];
    }
  }
  
  /**
   * Busca resumo dos rankings de um usuário
   */
  static async getUserRankingSummaries(userId: string): Promise<RankingSummary[]> {
    try {
      const rankings = await this.getUserRankings(userId);
      if (!rankings) return [];
      
      const summaries: RankingSummary[] = [];
      
      for (const [rankingId, rankingData] of Object.entries(rankings.rankings)) {
        // Buscar informações do concurso
        const { data: concurso } = await supabase
          .from('concursos')
          .select('titulo')
          .eq('id', rankingData.concurso_id)
          .single();
        
        summaries.push({
          ranking_id: rankingId,
          concurso_id: rankingData.concurso_id,
          concurso_titulo: concurso?.titulo || 'Concurso não encontrado',
          score: rankingData.score,
          position: rankingData.general_position || 0,
          quota_position: rankingData.quota_position,
          status: rankingData.status,
          reservation_type: rankingData.reservation_type,
          last_updated: rankingData.control_metadata?.last_updated || ''
        });
      }
      
      return summaries;
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error fetching ranking summaries:', error);
      return [];
    }
  }
  
  // ============================================================================
  // MÉTODOS DE ATUALIZAÇÃO E PERSISTÊNCIA
  // ============================================================================
  
  /**
   * Cria ou atualiza um ranking de usuário
   */
  static async upsertUserRanking(
    userId: string, 
    rankingId: string, 
    rankingData: UserRankingData
  ): Promise<boolean> {
    try {
      // Buscar dados atuais
      const currentData = await this.getUserRankings(userId);
      
      let consolidatedData: ConsolidatedUserRankings;
      
      if (currentData) {
        // Atualizar ranking existente
        consolidatedData = {
          ...currentData,
          rankings: {
            ...currentData.rankings,
            [rankingId]: rankingData
          },
          metadata: {
            ...currentData.metadata,
            last_updated: new Date().toISOString(),
            total_rankings: Object.keys({
              ...currentData.rankings,
              [rankingId]: rankingData
            }).length
          }
        };
      } else {
        // Criar nova estrutura
        consolidatedData = {
          rankings: {
            [rankingId]: rankingData
          },
          metadata: {
            last_updated: new Date().toISOString(),
            version: '2.0',
            total_rankings: 1,
            user_id: userId
          }
        };
      }
      
      // Salvar no banco
      const { error } = await supabase
        .from('user_rankings')
        .upsert({
          user_id: userId,
          consolidated_data: consolidatedData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error upserting user ranking:', error);
      return false;
    }
  }
  
  /**
   * Atualiza ranking específico usando RPC
   */
  static async updateUserRanking(
    userId: string,
    rankingId: string,
    rankingData: UserRankingData
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_user_ranking', {
        p_user_id: userId,
        p_ranking_id: rankingId,
        p_ranking_data: rankingData
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error updating user ranking:', error);
      return false;
    }
  }
  
  /**
   * Remove um ranking específico
   */
  static async removeUserRanking(userId: string, rankingId: string): Promise<boolean> {
    try {
      const currentData = await this.getUserRankings(userId);
      if (!currentData) return false;
      
      const { [rankingId]: removed, ...remainingRankings } = currentData.rankings;
      
      const updatedData: ConsolidatedUserRankings = {
        ...currentData,
        rankings: remainingRankings,
        metadata: {
          ...currentData.metadata,
          last_updated: new Date().toISOString(),
          total_rankings: Object.keys(remainingRankings).length
        }
      };
      
      const { error } = await supabase
        .from('user_rankings')
        .update({
          consolidated_data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error removing user ranking:', error);
      return false;
    }
  }
  
  // ============================================================================
  // MÉTODOS DE CÁLCULO E ANÁLISE
  // ============================================================================
  
  /**
   * Calcula posições de um concurso
   */
  static async calculateConcursoPositions(concursoId: string): Promise<{
    general: Array<{ user_id: string; position: number; score: number }>;
    quotas: { [quota: string]: Array<{ user_id: string; position: number; score: number }> };
  }> {
    try {
      const rankings = await this.getConcursoRankings(concursoId);
      
      // Ordenar por pontuação (decrescente)
      const sortedRankings = rankings
        .map(r => ({
          user_id: r.user_id,
          ranking_id: r.ranking_id,
          score: r.ranking_data.score,
          reservation_type: r.ranking_data.reservation_type
        }))
        .sort((a, b) => b.score - a.score);
      
      // Calcular posições gerais
      const general = sortedRankings.map((ranking, index) => ({
        user_id: ranking.user_id,
        position: index + 1,
        score: ranking.score
      }));
      
      // Calcular posições por cota
      const quotas: { [quota: string]: Array<{ user_id: string; position: number; score: number }> } = {};
      
      for (const quota of ['Ampla Concorrência', 'PPP', 'PCD', 'Hipossuficientes', 'Indígenas', 'Pessoas Trans']) {
        const quotaRankings = sortedRankings
          .filter(r => r.reservation_type === quota)
          .map((ranking, index) => ({
            user_id: ranking.user_id,
            position: index + 1,
            score: ranking.score
          }));
        
        if (quotaRankings.length > 0) {
          quotas[quota] = quotaRankings;
        }
      }
      
      return { general, quotas };
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error calculating positions:', error);
      return { general: [], quotas: {} };
    }
  }
  
  /**
   * Calcula estatísticas de uma cota
   */
  static async calculateQuotaStatistics(
    concursoId: string, 
    quotaType: QuotaType
  ): Promise<QuotaRanking | null> {
    try {
      const rankings = await this.getConcursoRankings(concursoId);
      const quotaRankings = rankings
        .filter(r => r.ranking_data.reservation_type === quotaType)
        .map(r => r.ranking_data.score)
        .sort((a, b) => b - a);
      
      if (quotaRankings.length === 0) return null;
      
      return {
        quota_type: quotaType,
        position: 0, // Será calculado individualmente
        total_participants: quotaRankings.length,
        min_score: quotaRankings[quotaRankings.length - 1],
        max_score: quotaRankings[0]
      };
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error calculating quota statistics:', error);
      return null;
    }
  }
  
  // ============================================================================
  // MÉTODOS DE VALIDAÇÃO E INTEGRIDADE
  // ============================================================================
  
  /**
   * Valida integridade dos dados de um ranking
   */
  static validateRankingData(rankingData: UserRankingData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validar campos obrigatórios
    if (!rankingData.concurso_id) errors.push('concurso_id é obrigatório');
    if (!rankingData.selected_booklet_id) errors.push('selected_booklet_id é obrigatório');
    if (typeof rankingData.score !== 'number') errors.push('score deve ser um número');
    if (typeof rankingData.edit_count !== 'number') errors.push('edit_count deve ser um número');
    if (!rankingData.reservation_type) errors.push('reservation_type é obrigatório');
    if (!rankingData.status) errors.push('status é obrigatório');
    
    // Validar pontuações
    if (rankingData.score < 0) errors.push('score não pode ser negativo');
    if (rankingData.edit_count < 0) errors.push('edit_count não pode ser negativo');
    
    // Validar pontuações subjetivas
    const subjectiveScores = rankingData.subjective_scores;
    if (subjectiveScores) {
      Object.entries(subjectiveScores).forEach(([key, value]) => {
        if (typeof value !== 'number' || value < 0) {
          errors.push(`${key} deve ser um número não negativo`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Verifica se um usuário pode participar de um concurso
   */
  static async canUserParticipate(userId: string, concursoId: string): Promise<{
    canParticipate: boolean;
    reason?: string;
  }> {
    try {
      // Verificar se já está participando
      const existingRanking = await this.getUserRankingByConcurso(userId, concursoId);
      if (existingRanking) {
        return {
          canParticipate: false,
          reason: 'Usuário já está participando deste concurso'
        };
      }
      
      // Verificar limite de concursos simultâneos (se aplicável)
      const userRankings = await this.getUserRankings(userId);
      const activeRankings = userRankings ? 
        Object.values(userRankings.rankings).filter(r => r.status === 'participando').length : 0;
      
      // Limite de 5 concursos simultâneos (configurável)
      if (activeRankings >= 5) {
        return {
          canParticipate: false,
          reason: 'Limite de concursos simultâneos atingido'
        };
      }
      
      return { canParticipate: true };
    } catch (error) {
      console.error('[OptimizedUserRankingsService] Error checking participation:', error);
      return {
        canParticipate: false,
        reason: 'Erro interno ao verificar participação'
      };
    }
  }
  
  // ============================================================================
  // MÉTODOS DE UTILIDADE
  // ============================================================================
  
  /**
   * Gera ID único para ranking
   */
  static generateRankingId(concursoId: string, userId: string): string {
    const timestamp = Date.now();
    return `ranking_${concursoId}_${userId}_${timestamp}`;
  }
  
  /**
   * Cria estrutura inicial de ranking
   */
  static createInitialRankingData(
    concursoId: string,
    bookletId: string,
    reservationType: QuotaType
  ): UserRankingData {
    return {
      concurso_id: concursoId,
      selected_booklet_id: bookletId,
      score: 0,
      edit_count: 0,
      all_questions_answered: false,
      reservation_type: reservationType,
      object_scores: {},
      subjective_scores: {
        discursive_score: 0,
        case_study_1_score: 0,
        case_study_2_score: 0,
        case_study_3_score: 0,
        other_subjective_score: 0
      },
      weighted_subjective_scores: {
        weighted_discursive_score: 0,
        weighted_case_study_1_score: 0,
        weighted_case_study_2_score: 0,
        weighted_case_study_3_score: 0,
        weighted_other_subjective_score: 0
      },
      custom_discipline_scores: {},
      weighted_custom_discipline_scores: {},
      answers: {},
      status: 'participando',
      below_minimum: false,
      below_discipline_minimums: [],
      below_block_minimums: [],
      control_metadata: {
        is_score_recalculated: false,
        edit_history: [],
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        version: '2.0'
      }
    };
  }
}

export default OptimizedUserRankingsService;








