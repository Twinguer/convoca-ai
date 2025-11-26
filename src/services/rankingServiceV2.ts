// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';

// Interface para a nova estrutura normalizada
export interface RankingV2 {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  reservationType: string;
  displayReservation?: string;
  id: string;
  quotaPosition?: number;
  belowMinimum?: boolean;
  belowDisciplineMinimums?: string[];
  rankingId: string;
  createdAt: string;
  // Campos das notas individuais
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  weightedDiscursiveScore?: number;
  weightedCaseStudy1Score?: number;
  weightedCaseStudy2Score?: number;
  weightedCaseStudy3Score?: number;
  subjectScores?: any;
}

// Interface para dados do ranking
export interface RankingData {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  exam_type: string;
  has_minimum_score: boolean;
  total_minimum_score: number;
  total_participants: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Interface para disciplina do ranking
export interface RankingDiscipline {
  id: string;
  discipline_id: string;
  discipline_name: string;
  minimum_score: number;
  weight: number;
}

// ✅ CORREÇÃO: Importar função de normalização para garantir nomenclatura correta
import { getReservationAbbreviation as getReservationAbbreviationNormalized, normalizeReservationType } from '@/utils/quotaNormalization';

// Helper function to get abbreviation for reservation type
// Agora usa a função centralizada de normalização
const getReservationAbbreviation = (reservationType: string): string => {
  return getReservationAbbreviationNormalized(reservationType);
};

// Buscar rankings usando a nova estrutura normalizada
export const fetchUserRankingsV2 = async (
  rankingId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<RankingV2[]> => {
  const startTime = performance.now();
  const page = Math.floor(offset / limit) + 1;

  try {
    logger.ranking('Fetching rankings V2', `rankingId: ${rankingId}, page: ${page}, limit: ${limit}`);

    // Verificar cache local primeiro
    const localCachedRankings = rankingCache.getRankings(rankingId, page, limit);
    
    if (localCachedRankings) {
      logger.ranking('Rankings loaded from local cache V2', `rankingId: ${rankingId}, page: ${page}, count: ${localCachedRankings.length}`);
      
      const endTime = performance.now();
      logger.performance('fetchUserRankingsV2 (local cached)', endTime - startTime, 'RANKING_SERVICE_V2');
      
      return localCachedRankings as RankingV2[];
    }
    
    // Query usando nova estrutura consolidated_data
    logger.ranking('Executing ranking query V2', `rankingId: ${rankingId}, offset: ${offset}, limit: ${limit}`);
    
    // Buscar todos os user_rankings com consolidated_data
    const { data: allUserRankings, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        user_id,
        consolidated_data
      `);

    if (rankingError) {
      logger.error('Error fetching user rankings V2', 'RANKING_SERVICE_V2', rankingError);
      throw rankingError;
    }

    // Filtrar rankings para o concurso específico
    const rankingsForConcurso = [];
    if (allUserRankings) {
      allUserRankings.forEach(userRanking => {
        if (userRanking.consolidated_data?.rankings) {
          Object.entries(userRanking.consolidated_data.rankings).forEach(([rankingIdKey, rankingData]: [string, any]) => {
            if (rankingData.concurso_id === rankingId) {
              rankingsForConcurso.push({
                id: rankingIdKey,
                user_id: userRanking.user_id,
                ...rankingData
              });
            }
          });
        }
      });
    }

    // Filtrar por tipo de reserva se especificado
    let filteredRankings = rankingsForConcurso;
    if (reservationType && reservationType !== 'Ampla Concorrência') {
      filteredRankings = rankingsForConcurso.filter(r => r.user_data?.reservation_type === reservationType);
    }

    // Ordenar por score
    filteredRankings.sort((a, b) => (b.user_data?.score || 0) - (a.user_data?.score || 0));

    // Aplicar paginação
    const paginatedRankings = filteredRankings.slice(offset, offset + limit);

    // Buscar perfis dos usuários
    const userIds = paginatedRankings.map(r => r.user_id);
    const { data: userProfiles, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      logger.error('Error fetching user profiles V2', 'RANKING_SERVICE_V2', profileError);
      throw profileError;
    }

    // Criar mapa de perfis para lookup rápido
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Mapear dados para a estrutura esperada
    const rankingData = paginatedRankings.map((item, index) => {
      const userProfile = profileMap.get(item.user_id) || { name: 'Usuário', avatar_url: null };
      
      return {
        id: item.id,
        position: offset + index + 1,
        name: userProfile.name,
        score: item.user_data?.score || 0,
        userId: item.user_id,
        avatarUrl: userProfile.avatar_url,
        reservationType: item.user_data?.reservation_type || 'Ampla Concorrência',
        displayReservation: item.user_data?.reservation_type || 'Ampla Concorrência',
        // Pontuações subjetivas (sem peso)
        discursiveScore: item.user_data?.subjective_scores?.discursive_score || 0,
        caseStudy1Score: item.user_data?.subjective_scores?.case_study_1_score || 0,
        caseStudy2Score: item.user_data?.subjective_scores?.case_study_2_score || 0,
        caseStudy3Score: item.user_data?.subjective_scores?.case_study_3_score || 0,
        otherSubjectiveScore: item.user_data?.subjective_scores?.other_subjective_score || 0,
        // ✅ CORREÇÃO: Pontuações subjetivas com peso (usar weighted_subjective_scores se disponível)
        weightedDiscursiveScore: item.user_data?.weighted_subjective_scores?.weighted_discursive_score || 
                                item.user_data?.weightedSubjectiveScores?.weightedDiscursiveScore || 
                                item.user_data?.subjective_scores?.discursive_score || 0,
        weightedCaseStudy1Score: item.user_data?.weighted_subjective_scores?.weighted_case_study_1_score || 
                                 item.user_data?.weightedSubjectiveScores?.weightedCaseStudy1Score || 
                                 item.user_data?.subjective_scores?.case_study_1_score || 0,
        weightedCaseStudy2Score: item.user_data?.weighted_subjective_scores?.weighted_case_study_2_score || 
                                 item.user_data?.weightedSubjectiveScores?.weightedCaseStudy2Score || 
                                 item.user_data?.subjective_scores?.case_study_2_score || 0,
        weightedCaseStudy3Score: item.user_data?.weighted_subjective_scores?.weighted_case_study_3_score || 
                                 item.user_data?.weightedSubjectiveScores?.weightedCaseStudy3Score || 
                                 item.user_data?.subjective_scores?.case_study_3_score || 0,
        weightedOtherSubjectiveScore: item.user_data?.weighted_subjective_scores?.weighted_other_subjective_score || 
                                     item.user_data?.weightedSubjectiveScores?.weightedOtherSubjectiveScore || 
                                     item.user_data?.subjective_scores?.other_subjective_score || 0,
        // Pontuações de disciplinas customizadas (sem peso)
        customDisciplineScores: item.user_data?.object_scores || {},
        // ✅ CORREÇÃO: Pontuações de disciplinas customizadas com peso (usar weightedCustomDisciplineScores se disponível)
        weightedCustomDisciplineScores: item.user_data?.weightedCustomDisciplineScores || 
                                        item.user_data?.weighted_object_scores || 
                                        item.user_data?.object_scores || {},
      };
    });

    logger.ranking('Query result V2', `data: ${rankingData?.length || 0} records`);

    if (!rankingData || rankingData.length === 0) {
      logger.ranking('No rankings found V2', `rankingId: ${rankingId}`);
      return [];
    }

    // Buscar dados do ranking
    const { data: rankingInfo, error: rankingInfoError } = await supabase
      .from('concursos')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        exam_type,
        has_minimum_score,
        total_minimum_score,
        total_participants,
        status
      `)
      .eq('id', rankingId)
      .single();

    if (rankingInfoError) {
      logger.warn('Could not fetch ranking data V2', 'RANKING_SERVICE_V2', rankingInfoError);
    }

    // Buscar disciplinas do JSONB disciplines na tabela concursos
    const disciplinesData = rankingInfo?.disciplines || [];

    // Obter dados do ranking
    const hasMinimumScoreEnabled = rankingInfo?.has_minimum_score === true;
    const totalMinimumScore = hasMinimumScoreEnabled ? rankingInfo?.total_minimum_score || 0 : 0;

    // Formatar os dados do ranking com posições
    const formattedRankings: RankingV2[] = rankingData.map((ranking, index) => {
      const user = ranking.users_profiles;
      const name = user?.name || 'Usuário Anônimo';
      const avatarUrl = user?.avatar_url || null;

      // ✅ Usar apenas dados do backend - sem lógica de cálculo no frontend
      // Os flags belowMinimum e belowDisciplineMinimums devem vir do backend
      // Se não vierem, assumir false/vazio para compatibilidade
      const belowMinimum = ranking.below_minimum || ranking.belowMinimum || false;
      const belowDisciplineMinimums = ranking.below_discipline_minimums || ranking.belowDisciplineMinimums || [];
    
      return {
        position: offset + index + 1, // Posição global considerando offset
        name: name,
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: avatarUrl,
        reservationType: normalizeReservationType(ranking.reservation_type || 'Ampla Concorrência'),
        displayReservation: getReservationAbbreviation(ranking.reservation_type || 'Ampla Concorrência'),
        id: ranking.id,
        rankingId: ranking.concurso_id,
        createdAt: ranking.created_at,
        belowMinimum,
        belowDisciplineMinimums,
        // Campos das notas individuais
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        weightedDiscursiveScore: ranking.weighted_discursive_score || 0,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score || 0,
        objectScores: ranking.object_scores || {},
      };
    });
        
    // Armazenar no cache local
    rankingCache.setRankings(rankingId, formattedRankings, page, limit);
    
    const endTime = performance.now();
    logger.performance('fetchUserRankingsV2', endTime - startTime, 'RANKING_SERVICE_V2');
    
    return formattedRankings;
    
  } catch (error) {
    logger.error('Error fetching rankings V2', 'RANKING_SERVICE_V2', error);
    
    // Tentar cache local como fallback
    const fallbackRankings = rankingCache.getRankings(rankingId, page, limit);
    if (fallbackRankings) {
      return fallbackRankings as RankingV2[];
    }
    
    return [];
  }
};

// Buscar dados de um ranking específico
export const fetchRankingData = async (rankingId: string): Promise<RankingData | null> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        exam_type,
        has_minimum_score,
        total_minimum_score,
        total_participants,
        status,
        created_at,
        updated_at
      `)
      .eq('id', rankingId)
      .single();

    if (error) {
      logger.error('Error fetching ranking data', 'RANKING_SERVICE_V2', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching ranking data', 'RANKING_SERVICE_V2', error);
    return null;
  }
};

// Buscar disciplinas de um ranking (agora do JSONB disciplines)
export const fetchRankingDisciplines = async (rankingId: string): Promise<RankingDiscipline[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('disciplines')
      .eq('id', rankingId)
      .single();

    if (error) {
      logger.error('Error fetching ranking disciplines', 'RANKING_SERVICE_V2', error);
      return [];
    }

    // Converter disciplinas do JSONB para o formato esperado
    const disciplines = data?.disciplines || [];
    return disciplines.map((d: any, index: number) => ({
      id: d.id || index.toString(),
      discipline_id: d.type || d.id,
      discipline_name: d.name,
      minimum_score: d.minimum_score || 0,
      weight: d.weight || 0
    }));
  } catch (error) {
    logger.error('Error fetching ranking disciplines', 'RANKING_SERVICE_V2', error);
    return [];
  }
};

// Buscar tipos de reserva disponíveis para um ranking
export const getAvailableReservationTypesV2 = async (rankingId: string): Promise<string[]> => {
  try {
    // Buscar todos os user_rankings e extrair reservation_type do consolidated_data
    const { data, error } = await supabase
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching reservation types V2', 'RANKING_SERVICE_V2', error);
      return ['Ampla Concorrência'];
    }

    const reservationTypes: string[] = [];
    
    data?.forEach(userRanking => {
      if (userRanking.consolidated_data?.rankings) {
        Object.values(userRanking.consolidated_data.rankings).forEach(ranking => {
          if (ranking.concurso_id === rankingId && ranking.reservation_type) {
            reservationTypes.push(ranking.reservation_type);
          }
        });
      }
    });

    // Extrair tipos únicos de reserva
    const uniqueTypes = [...new Set(reservationTypes)];
    
    // Garantir que 'Ampla Concorrência' esteja sempre presente
    if (!uniqueTypes.includes('Ampla Concorrência')) {
      uniqueTypes.unshift('Ampla Concorrência');
    }

    logger.ranking('Available reservation types V2', `rankingId: ${rankingId}, types: ${uniqueTypes.join(', ')}`);
    return uniqueTypes;
  } catch (error) {
    logger.error('Error determining available reservation types V2', 'RANKING_SERVICE_V2', error);
    return ['Ampla Concorrência'];
  }
};

// Buscar estatísticas de um ranking
export const fetchRankingStats = async (rankingId: string) => {
  try {
    // Buscar todos os user_rankings e extrair dados do consolidated_data
    const { data, error } = await supabase
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching ranking stats', 'RANKING_SERVICE_V2', error);
      return null;
    }

    const scores: number[] = [];
    const reservationTypeStats: { [key: string]: number } = {};
    
    data?.forEach(userRanking => {
      if (userRanking.consolidated_data?.rankings) {
        Object.values(userRanking.consolidated_data.rankings).forEach(ranking => {
          if (ranking.concurso_id === rankingId) {
            const score = ranking.user_data?.score || 0;
            const reservationType = ranking.reservation_type || 'Ampla Concorrência';
            
            scores.push(score);
            reservationTypeStats[reservationType] = (reservationTypeStats[reservationType] || 0) + 1;
          }
        });
      }
    });

    if (scores.length === 0) {
      return {
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        reservationTypeStats: {}
      };
    }

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    return {
      totalParticipants: scores.length,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      reservationTypeStats
    };
  } catch (error) {
    logger.error('Error fetching ranking stats', 'RANKING_SERVICE_V2', error);
    return null;
  }
};
