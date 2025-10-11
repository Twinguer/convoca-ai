
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
  // Campos adicionais
  reservationType: string;
  displayReservation?: string;
  id: string;
  quotaPosition?: number; // Posição dentro da cota - será calculado em runtime
  // Flags para mínimos não atingidos
  belowMinimum?: boolean; // Não atingiu mínimo geral
  belowBlockMinimums?: string[]; // Blocos com mínimo não atingido (IDs)
  belowDisciplineMinimums?: string[]; // Disciplinas com mínimo não atingido (IDs)
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
    
    // Query usando tabela user_rankings (estrutura atual)
    logger.ranking('Executing ranking query', `concursoId: ${concursoId}, offset: ${offset}, limit: ${limit}`);
    
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        subject_scores,
        customDisciplineScores,
        weightedCustomDisciplineScores,
        reservation_type
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

    // Buscar dados do concurso
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('id, total_minimum_score, has_minimum_score, disciplines')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      logger.warn('Could not fetch concurso data', 'RANKING_SERVICE', concursoError);
    }

    // Buscar dados dos usuários
    const userIds = rankingData.map(r => r.user_id);
    const { data: userData, error: userError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (userError) {
      logger.warn('Could not fetch user data', 'RANKING_SERVICE', userError);
    }

    // Criar mapa de usuários para lookup rápido
    const userMap = new Map();
    if (userData) {
      userData.forEach(user => {
        userMap.set(user.id, user);
      });
    }

    // Obter dados do concurso
    const hasMinimumScoreEnabled = concursoData?.has_minimum_score === true;
    const totalMinimumScore = hasMinimumScoreEnabled ? concursoData?.total_minimum_score || 0 : 0;

    // Formatar os dados do ranking com posições
    const formattedRankings = rankingData.map((ranking, index) => {
      const user = userMap.get(ranking.user_id);
      const name = user?.name || 'Usuário Anônimo';
      const avatarUrl = user?.avatar_url || null;

      // Processar pontuações customizadas
      const customDisciplineScores = ranking.custom_discipline_scores || {};
      const weightedCustomDisciplineScores = ranking.weighted_custom_discipline_scores || {};
      
      // Verificação de mínimos
      const belowMinimum = ranking.score <= 0 || 
        (hasMinimumScoreEnabled && totalMinimumScore > 0 && ranking.score < totalMinimumScore);
    
      return {
        position: offset + index + 1, // Posição global considerando offset
        name: name,
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: avatarUrl,
        // Pontuações subjetivas
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        // Pontuações subjetivas com peso
        weightedDiscursiveScore: ranking.weighted_discursive_score || 0,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores: customDisciplineScores,
        weightedCustomDisciplineScores: weightedCustomDisciplineScores,
        // Flags de mínimos não atingidos
        belowMinimum,
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
