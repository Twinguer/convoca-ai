// @ts-nocheck
/**
 * ✅ CONSOLIDADO: Serviço único de rankings
 * 
 * Este arquivo consolida as funcionalidades de rankingService.ts (V1),
 * rankingServiceV2.ts e rankingServiceV3.ts em uma única implementação.
 * 
 * Características:
 * - Usa RPCs para segurança e performance
 * - Interface única e consistente
 * - Cache otimizado com suporte a reservationType
 */
import { supabase } from '@/integrations/supabase/client';
import { getReservationAbbreviation, normalizeReservationType } from '@/utils/quotaNormalization';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';

// ✅ Interface única consolidada (anteriormente RankingV3)
export interface Ranking {
  id: string;
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string;
  reservationType: string;
  displayReservation: string;
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  otherSubjectiveScore?: number;
  customDisciplineScores?: Record<string, number>;
  belowMinimum?: boolean;
  belowDisciplineMinimums?: string[];
  belowBlockMinimums?: string[];
}

// ✅ Interface consolidada (anteriormente RankingDataV3)
export interface RankingData {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  total_participants: number;
  created_at: string;
  exam_type: string;
  disciplines?: any[];
  official_answers?: Record<string, any>;
}

/**
 * Busca rankings de forma otimizada usando JOINs nativos do Supabase
 * @param concursoId ID do concurso
 * @param reservationType Tipo de reserva (opcional)
 * @param offset Offset para paginação
 * @param limit Limite de resultados
 */
// ✅ Função principal consolidada (anteriormente fetchUserRankingsV3)
export const fetchUserRankings = async (
  concursoId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<Ranking[]> => {
  const startTime = performance.now();
  
  try {
    logger.info('fetchUserRankings called', 'RANKING_SERVICE', {
      concursoId,
      reservationType,
      offset,
      limit
    });

    const page = Math.floor(offset / limit) + 1;

    // Verificar cache local primeiro
    const localCachedRankings = rankingCache.getRankings(concursoId, page, limit, reservationType);
    
    if (localCachedRankings) {
      logger.ranking('Rankings loaded from local cache V3', `concursoId: ${concursoId}, page: ${page}, count: ${localCachedRankings.length}`);
      
      const endTime = performance.now();
      logger.performance('fetchUserRankings (local cached)', endTime - startTime, 'RANKING_SERVICE');
      
      return localCachedRankings as Ranking[];
    }

    // ✅ FASE 2: Migrar para usar RPC em vez de query direta
    // Usar função RPC que retorna rankings do concurso (acesso público)
    const { data: allUserRankings, error: rankingError } = await supabase.rpc('get_rankings_for_concurso', {
      p_concurso_id: concursoId,
      p_reservation_type: reservationType || null,
      p_offset: offset,
      p_limit: limit
    });

    if (rankingError) {
      logger.error('Error calling get_rankings_for_concurso V3', 'RANKING_SERVICE_V3', rankingError);
      throw new Error(`Ranking query error: ${rankingError.message}`);
    }

    if (!allUserRankings || allUserRankings.length === 0) {
      return [];
    }

    // Processar consolidated_data para extrair rankings do concurso específico
    const rankingsForConcurso = [];
    
    for (const item of allUserRankings) {
      const consolidatedData = item.consolidated_data || {};
      
      if (consolidatedData.rankings) {
        // Encontrar o ranking específico deste concurso
        for (const [rankingId, ranking] of Object.entries(consolidatedData.rankings)) {
          if ((ranking as any).concurso_id === concursoId) {
            rankingsForConcurso.push({
              user_id: item.user_id,
              rankingId,
              rankingData: ranking
            });
            break; // Apenas um ranking por concurso por usuário
          }
        }
      }
    }

    // Ordenar por score (descendente)
    rankingsForConcurso.sort((a, b) => {
      const scoreA = (a.rankingData as any).user_data?.score || 0;
      const scoreB = (b.rankingData as any).user_data?.score || 0;
      return scoreB - scoreA;
    });

    // Buscar perfis de usuários separadamente (RPC não retorna perfis)
    const userIds = [...new Set(rankingsForConcurso.map((item: any) => item.user_id))];
    
    const { data: userProfiles, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      logger.error('Error fetching user profiles V3', 'RANKING_SERVICE_V3', profileError);
      // Continuar mesmo sem perfis (usar valores padrão)
    }

    // Criar mapa de perfis para lookup rápido
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Mapear resultados para o formato esperado
    const paginatedData = rankingsForConcurso.map((item: any) => {
      const userProfile = profileMap.get(item.user_id) || { name: 'Usuário', avatar_url: null };
      return {
        user_id: item.user_id,
        rankingId: item.rankingId,
        rankingData: item.rankingData,
        users_profiles: userProfile
      };
    });

    // Mapear resultados para o formato esperado
    const rankings: Ranking[] = paginatedData.map((item: any, index: number) => {
      // RPC retorna dados já formatados, mas precisamos extrair user_data
      const rankingData = item.rankingData || item;
      const userData = rankingData?.user_data || rankingData || {};
      
      // Extrair pontuações subjetivas da estrutura correta
      const subjectiveScores = userData?.subjectives || {};
      const objectScores = userData?.object_scores || {};
      
      // Debug logs removed for security

      return {
        id: item.rankingId || rankingData?.id || `ranking-${item.user_id}-${index}`, // Usar o rankingId específico
        position: offset + index + 1,
        name: item.users_profiles?.name || 'Usuário',
        score: userData?.score || rankingData?.score || 0,
        userId: item.user_id,
        avatarUrl: item.users_profiles?.avatar_url || null,
        // ✅ CORREÇÃO: Normalizar reservation_type para garantir nomenclatura correta
        reservationType: normalizeReservationType(userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência'),
        displayReservation: getReservationAbbreviation(userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência'),
        discursiveScore: subjectiveScores.discursive || 0,
        caseStudy1Score: subjectiveScores.case_study_1 || 0,
        caseStudy2Score: subjectiveScores.case_study_2 || 0,
        caseStudy3Score: subjectiveScores.case_study_3 || 0,
        otherSubjectiveScore: subjectiveScores.other_subjective || 0,
        customDisciplineScores: objectScores,
        belowMinimum: false,
        belowDisciplineMinimums: [],
        belowBlockMinimums: [],
      };
    });

    // Armazenar no cache local
    rankingCache.setRankings(concursoId, rankings, page, limit, reservationType);

    const duration = performance.now() - startTime;
    logger.performance('fetchUserRankings completed', duration, 'RANKING_SERVICE', {
      count: rankings.length,
      offset,
      limit
    });

    return rankings;
  } catch (error) {
    logger.error('Error in fetchUserRankings', 'RANKING_SERVICE', error);
    throw error;
  }
};

/**
 * Busca dados do ranking (concurso)
 */
// ✅ Função consolidada (anteriormente fetchRankingDataV3)
export const fetchRankingData = async (concursoId: string): Promise<RankingData | null> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching ranking data V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    return data as RankingData;
  } catch (error) {
    logger.error('Error in fetchRankingData', 'RANKING_SERVICE', error);
    return null;
  }
};

/**
 * Busca disciplinas do ranking
 */
// ✅ Função consolidada (anteriormente fetchRankingDisciplinesV3)
export const fetchRankingDisciplines = async (concursoId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('disciplines')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching disciplines', 'RANKING_SERVICE', error);
      throw error;
    }

    return data?.disciplines || [];
  } catch (error) {
    logger.error('Error in fetchRankingDisciplines', 'RANKING_SERVICE', error);
    return [];
  }
};

/**
 * Busca tipos de reserva disponíveis para um ranking
 */
// ✅ Função consolidada (anteriormente getAvailableReservationTypesV3)
export const getAvailableReservationTypes = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching reservation types', 'RANKING_SERVICE', error);
      throw error;
    }

    const types = new Set<string>();
    types.add('Ampla Concorrência');

    data?.forEach((item: any) => {
      const rankings = item.consolidated_data?.rankings || {};
      Object.values(rankings).forEach((ranking: any) => {
        if (ranking?.concurso_id === concursoId) {
          const type = ranking?.user_data?.reservation_type || 'Ampla Concorrência';
          types.add(type);
        }
      });
    });

    return Array.from(types);
  } catch (error) {
    logger.error('Error in getAvailableReservationTypes', 'RANKING_SERVICE', error);
    return ['Ampla Concorrência'];
  }
};

/**
 * Busca estatísticas do ranking
 */
// ✅ Função consolidada (anteriormente fetchRankingStatsV3)
export const fetchRankingStats = async (concursoId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching stats', 'RANKING_SERVICE', error);
      throw error;
    }

    const entries: Array<{ score: number; reservation_type: string }> = [];

    data?.forEach((item: any) => {
      const rankings = item.consolidated_data?.rankings || {};
      Object.values(rankings).forEach((ranking: any) => {
        if (ranking?.concurso_id === concursoId) {
          entries.push({
            score: Number(ranking?.user_data?.score || 0),
            reservation_type: ranking?.user_data?.reservation_type || 'Ampla Concorrência'
          });
        }
      });
    });

    const totalParticipants = entries.length;
    const scores = entries.map(e => e.score);
    const avgScore = totalParticipants > 0 ? (scores.reduce((a, b) => a + b, 0) / totalParticipants) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;

    const reservationTypeCount: Record<string, number> = {};
    entries.forEach(e => {
      reservationTypeCount[e.reservation_type] = (reservationTypeCount[e.reservation_type] || 0) + 1;
    });

    return {
      total_participants: totalParticipants,
      avg_score: avgScore,
      max_score: maxScore,
      min_score: minScore,
      reservation_type_count: reservationTypeCount,
    };
  } catch (error) {
    logger.error('Error in fetchRankingStats', 'RANKING_SERVICE', error);
    return null;
  }
};

/**
 * Calcula score usando Edge Function
 */
export const calculateRankingScore = async (
  userId: string,
  concursoId: string,
  answers: Record<string, string>,
  bookletId: string,
  reservationType: string,
  subjectiveScores?: {
    discursive_score?: number;
    case_study_1_score?: number;
    case_study_2_score?: number;
    case_study_3_score?: number;
    other_subjective_score?: number;
  }
): Promise<{ success: boolean; score?: number; error?: string }> => {
  try {
    logger.info('calculateRankingScore called', 'RANKING_SERVICE', {
      userId,
      concursoId,
      bookletId,
      answerCount: Object.keys(answers).length
    });

    const { data, error } = await supabase.functions.invoke('calculate-ranking-score', {
      body: {
        userId,
        concursoId,
        answers,
        bookletId,
        reservationType,
        subjectiveScores,
      },
    });

    if (error) {
      logger.error('Error calling calculate-ranking-score function', 'RANKING_SERVICE', error);
      return { success: false, error: error.message };
    }

    logger.info('Score calculated successfully', 'RANKING_SERVICE', {
      score: data.score
    });

    return { success: true, score: data.score };
  } catch (error: any) {
    logger.error('Error in calculateRankingScore', 'RANKING_SERVICE', error);
    return { success: false, error: error.message };
  }
};
