
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';

// Defining the Ranking interface to fix TypeScript errors
export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  // Pontuações subjetivas
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  // Pontuações subjetivas com peso
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  // Pontuações de disciplinas customizadas
  customDisciplineScores?: { [key: string]: number };
  weightedCustomDisciplineScores?: { [key: string]: number };
  // Flags de mínimos não atingidos
  belowMinimum?: boolean;
  belowDisciplineMinimums?: string[];
  belowBlockMinimums?: string[];
  // Campos adicionais
  reservationType: string;
  displayReservation?: string;
  id: string;
  quotaPosition?: number; // Posição dentro da cota - será calculado em runtime
}

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  
  // Get first three letters as abbreviation
  const abbr = reservationType.substring(0, 3).toUpperCase();
  return abbr;
};

export const fetchUserRankings = async (
  concursoId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<Ranking[]> => {
  const startTime = performance.now();
  const page = Math.floor(offset / limit) + 1;

  try {
    logger.ranking('Fetching rankings', `concursoId: ${concursoId}, page: ${page}, limit: ${limit}`);

    // Verificar cache local primeiro
    const localCachedRankings = rankingCache.getRankings(concursoId, page, limit);
    
    if (localCachedRankings) {
      logger.ranking('Rankings loaded from local cache', `concursoId: ${concursoId}, page: ${page}, count: ${localCachedRankings.length}`);
      
      const endTime = performance.now();
      logger.performance('fetchUserRankings (local cached)', endTime - startTime, 'RANKING_SERVICE');
      
      return localCachedRankings;
    }
    
    // Query usando nova estrutura normalizada
    logger.ranking('Executing ranking query V2', `rankingId: ${concursoId}, offset: ${offset}, limit: ${limit}`);
    
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        concurso_id,
        user_id,
        score,
        reservation_type,
        created_at,
        "weightedCustomDisciplineScores",
        "customDisciplineScores",
        "weighted_discursive_score",
        "weighted_case_study_1_score", 
        "weighted_case_study_2_score",
        "weighted_case_study_3_score",
        users_profiles!inner(
          id,
          name,
          avatar_url
        )
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1);

    logger.ranking('Query result', `data: ${rankingData?.length || 0} records, error: ${rankingError?.message || 'none'}`);

    if (rankingError) {
      throw new Error(`Ranking query error: ${rankingError.message}`);
    }

    if (!rankingData || rankingData.length === 0) {
      logger.ranking('No rankings found', `concursoId: ${concursoId}`);
      return [];
    }

    // Buscar dados do ranking (nova estrutura)
    const { data: rankingInfo, error: rankingInfoError } = await supabase
      .from('concursos')
      .select('id, total_minimum_score, has_minimum_score')
      .eq('id', concursoId)
      .single();

    if (rankingInfoError) {
      logger.warn('Could not fetch ranking data', 'RANKING_SERVICE', rankingInfoError);
    }

    // Obter dados do ranking
    const hasMinimumScoreEnabled = rankingInfo?.has_minimum_score === true;
    const totalMinimumScore = hasMinimumScoreEnabled ? rankingInfo?.total_minimum_score || 0 : 0;

    // Formatar os dados do ranking com posições (nova estrutura normalizada)
    const formattedRankings = rankingData.map((ranking, index) => {
      const name = ranking.users_profiles?.name || 'Usuário Anônimo';
      const avatarUrl = ranking.users_profiles?.avatar_url || null;

      // Verificação de mínimos (simplificada para nova estrutura)
      const belowMinimum = ranking.score <= 0 || 
        (hasMinimumScoreEnabled && totalMinimumScore > 0 && ranking.score < totalMinimumScore);
    
      return {
        position: offset + index + 1, // Calcular posição baseada no índice
        name: name,
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: avatarUrl,
        // Pontuações subjetivas
        discursiveScore: 0,
        caseStudy1Score: 0,
        caseStudy2Score: 0,
        caseStudy3Score: 0,
        // Pontuações subjetivas com peso
        weightedDiscursiveScore: ranking.weighted_discursive_score || 0,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores: ranking.customDisciplineScores || {},
        weightedCustomDisciplineScores: ranking.weightedCustomDisciplineScores || {},
        // Flags de mínimos não atingidos (valores padrão já que as colunas não existem)
        belowMinimum: belowMinimum,
        belowDisciplineMinimums: [],
        belowBlockMinimums: [],
        // Dados do ranking
        reservationType: ranking.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(ranking.reservation_type || 'Ampla Concorrência'),
        id: ranking.id,
      };
    });
        
    // Armazenar no cache local
    rankingCache.setRankings(concursoId, formattedRankings, page, limit);
    
    const endTime = performance.now();
    logger.performance('fetchUserRankings', endTime - startTime, 'RANKING_SERVICE');
    
    return formattedRankings;
    
  } catch (error) {
    logger.error('Error fetching rankings', 'RANKING_SERVICE', error);
    
    // Tentar cache local como fallback
    const fallbackRankings = rankingCache.getRankings(concursoId, page, limit);
    if (fallbackRankings) {
      return fallbackRankings;
    }
    
    return [];
  }
};


// Get the available reservation types for a concurso
export const getAvailableReservationTypes = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select(`
        has_ampla_concorrencia,
        has_ppp,
        has_pcd,
        has_hipossuficientes,
        has_indigenas,
        has_transsexuais
      `)
      .eq('id', concursoId)
      .single();
    
    if (error) {
      console.error('Error fetching concurso reservation types:', error);
      return ['Ampla Concorrência'];
    }
    
    const types = [];
    
    // Ampla Concorrência is always available
    types.push('Ampla Concorrência');
    
    if (data.has_ppp) types.push('PPP');
    if (data.has_pcd) types.push('PCD');
    if (data.has_hipossuficientes) types.push('Hipossuficientes');
    if (data.has_indigenas) types.push('Indígenas');
    if (data.has_transsexuais) types.push('Pessoas Trans');
    
    console.log('Available reservation types for concurso', concursoId, ':', types);
    return types;
  } catch (error) {
    console.error('Error determining available reservation types:', error);
    return ['Ampla Concorrência'];
  }
};
