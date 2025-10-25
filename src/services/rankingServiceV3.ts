import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';

export interface RankingV3 {
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

export interface RankingDataV3 {
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
export const fetchUserRankingsV3 = async (
  concursoId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<RankingV3[]> => {
  const startTime = performance.now();
  
  try {
    logger.info('fetchUserRankingsV3 called', 'RANKING_SERVICE_V3', {
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
      logger.performance('fetchUserRankingsV3 (local cached)', endTime - startTime, 'RANKING_SERVICE_V3');
      
      return localCachedRankings as RankingV3[];
    }

    // Query para buscar todos os user_rankings e filtrar por concurso_id no consolidated_data
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        user_id,
        consolidated_data,
        users_profiles!inner(id, name, avatar_url)
      `);

    if (error) {
      logger.error('Error fetching rankings V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Filtrar rankings que participam deste concurso específico
    const rankingsForConcurso = [];
    
    for (const item of data) {
      const consolidatedData = item.consolidated_data || {};
      
      if (consolidatedData.rankings) {
        // Verificar se este usuário participa do concurso
        for (const [rankingId, ranking] of Object.entries(consolidatedData.rankings)) {
          if ((ranking as any).concurso_id === concursoId) {
            rankingsForConcurso.push({
              ...item,
              rankingId,
              rankingData: ranking
            });
            break;
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

    // Aplicar paginação
    const paginatedData = rankingsForConcurso.slice(offset, offset + limit);

    // Mapear resultados para o formato esperado
    const rankings: RankingV3[] = paginatedData.map((item: any, index: number) => {
      const rankingData = item.rankingData;
      const userData = rankingData?.user_data || {};
      
      // Extrair pontuações subjetivas da estrutura correta
      const subjectiveScores = userData?.subjectives || {};
      const objectScores = userData?.object_scores || {};
      
      // Debug logs removed for security

      return {
        id: item.rankingId, // Usar o rankingId específico
        position: offset + index + 1,
        name: item.users_profiles.name || 'Usuário',
        score: userData?.score || 0, // ← CORREÇÃO: extrair do user_data
        userId: item.user_id,
        avatarUrl: item.users_profiles.avatar_url,
        reservationType: userData?.reservation_type || 'Ampla Concorrência',
        displayReservation: userData?.reservation_type || 'Ampla Concorrência',
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
    logger.performance('fetchUserRankingsV3 completed', duration, 'RANKING_SERVICE_V3', {
      count: rankings.length,
      offset,
      limit
    });

    return rankings;
  } catch (error) {
    logger.error('Error in fetchUserRankingsV3', 'RANKING_SERVICE_V3', error);
    throw error;
  }
};

/**
 * Busca dados do ranking (concurso)
 */
export const fetchRankingDataV3 = async (concursoId: string): Promise<RankingDataV3 | null> => {
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

    return data as RankingDataV3;
  } catch (error) {
    logger.error('Error in fetchRankingDataV3', 'RANKING_SERVICE_V3', error);
    return null;
  }
};

/**
 * Busca disciplinas do ranking
 */
export const fetchRankingDisciplinesV3 = async (concursoId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('disciplines')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching disciplines V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    return data?.disciplines || [];
  } catch (error) {
    logger.error('Error in fetchRankingDisciplinesV3', 'RANKING_SERVICE_V3', error);
    return [];
  }
};

/**
 * Busca tipos de reserva disponíveis para um ranking
 */
export const getAvailableReservationTypesV3 = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('reservation_type')
      .eq('concurso_id', concursoId);

    if (error) {
      logger.error('Error fetching reservation types V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    // Extrair tipos únicos
    const types = new Set<string>();
    types.add('Ampla Concorrência'); // Sempre incluir

    data?.forEach((item: any) => {
      if (item.reservation_type) {
        types.add(item.reservation_type);
      }
    });

    return Array.from(types);
  } catch (error) {
    logger.error('Error in getAvailableReservationTypesV3', 'RANKING_SERVICE_V3', error);
    return ['Ampla Concorrência'];
  }
};

/**
 * Busca estatísticas do ranking
 */
export const fetchRankingStatsV3 = async (concursoId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('score, reservation_type')
      .eq('concurso_id', concursoId);

    if (error) {
      logger.error('Error fetching stats V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    const totalParticipants = data?.length || 0;
    const avgScore = data?.reduce((sum, item) => sum + (item.score || 0), 0) / totalParticipants || 0;
    const maxScore = Math.max(...(data?.map(item => item.score || 0) || [0]));
    const minScore = Math.min(...(data?.map(item => item.score || 0) || [0]));

    // Contar por tipo de reserva
    const reservationTypeCount: Record<string, number> = {};
    data?.forEach((item: any) => {
      const type = item.reservation_type || 'Ampla Concorrência';
      reservationTypeCount[type] = (reservationTypeCount[type] || 0) + 1;
    });

    return {
      total_participants: totalParticipants,
      avg_score: avgScore,
      max_score: maxScore,
      min_score: minScore,
      reservation_type_count: reservationTypeCount,
    };
  } catch (error) {
    logger.error('Error in fetchRankingStatsV3', 'RANKING_SERVICE_V3', error);
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
    logger.info('calculateRankingScore called', 'RANKING_SERVICE_V3', {
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
      logger.error('Error calling calculate-ranking-score function', 'RANKING_SERVICE_V3', error);
      return { success: false, error: error.message };
    }

    logger.info('Score calculated successfully', 'RANKING_SERVICE_V3', {
      score: data.score
    });

    return { success: true, score: data.score };
  } catch (error: any) {
    logger.error('Error in calculateRankingScore', 'RANKING_SERVICE_V3', error);
    return { success: false, error: error.message };
  }
};
