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

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  
  const abbr = reservationType.substring(0, 3).toUpperCase();
  return abbr;
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
    
    // Query usando nova estrutura normalizada
    logger.ranking('Executing ranking query V2', `rankingId: ${rankingId}, offset: ${offset}, limit: ${limit}`);
    
    let query = supabase
      .from('user_rankings')
      .select(`
        id,
        concurso_id,
        user_id,
        score,
        position,
        reservation_type,
        created_at,
        users_profiles!inner(
          id,
          name,
          avatar_url
        )
      `)
      .eq('concurso_id', rankingId)
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por tipo de reserva se especificado
    if (reservationType && reservationType !== 'Ampla Concorrência') {
      query = query.eq('reservation_type', reservationType);
    }

    const { data: rankingData, error: rankingError } = await query;

    logger.ranking('Query result V2', `data: ${rankingData?.length || 0} records, error: ${rankingError?.message || 'none'}`);

    if (rankingError) {
      throw new Error(`Ranking query error V2: ${rankingError.message}`);
    }

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

      // Verificação de mínimos
      const belowMinimum = ranking.score <= 0 || 
        (hasMinimumScoreEnabled && totalMinimumScore > 0 && ranking.score < totalMinimumScore);

      // Verificar mínimos por disciplina
      const belowDisciplineMinimums: string[] = [];
      if (disciplinesData) {
        disciplinesData.forEach(discipline => {
          if (discipline.minimum_score > 0) {
            // Aqui você pode implementar lógica específica para verificar mínimos por disciplina
            // Por enquanto, vamos apenas marcar se o score geral está abaixo do mínimo
            if (ranking.score < discipline.minimum_score) {
              belowDisciplineMinimums.push(discipline.discipline_id);
            }
          }
        });
      }
    
      return {
        position: offset + index + 1, // Posição global considerando offset
        name: name,
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: avatarUrl,
        reservationType: ranking.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(ranking.reservation_type || 'Ampla Concorrência'),
        id: ranking.id,
        rankingId: ranking.concurso_id,
        createdAt: ranking.created_at,
        belowMinimum,
        belowDisciplineMinimums,
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
    const { data, error } = await supabase
      .from('user_rankings')
      .select('reservation_type')
      .eq('concurso_id', rankingId);

    if (error) {
      logger.error('Error fetching reservation types V2', 'RANKING_SERVICE_V2', error);
      return ['Ampla Concorrência'];
    }

    // Extrair tipos únicos de reserva
    const uniqueTypes = [...new Set(data?.map(r => r.reservation_type) || [])];
    
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
    const { data, error } = await supabase
      .from('user_rankings')
      .select('score, reservation_type')
      .eq('concurso_id', rankingId);

    if (error) {
      logger.error('Error fetching ranking stats', 'RANKING_SERVICE_V2', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        reservationTypeStats: {}
      };
    }

    const scores = data.map(r => r.score).filter(s => s !== null && s !== undefined);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Estatísticas por tipo de reserva
    const reservationTypeStats: { [key: string]: number } = {};
    data.forEach(ranking => {
      const type = ranking.reservation_type || 'Ampla Concorrência';
      reservationTypeStats[type] = (reservationTypeStats[type] || 0) + 1;
    });

    return {
      totalParticipants: data.length,
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
