
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
  otherSubjectiveScore?: number | null;
  // Pontuações subjetivas com peso
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  weightedOtherSubjectiveScore?: number | null;
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

    // Verificar cache local primeiro (DESABILITADO TEMPORARIAMENTE PARA DEBUG)
    // const localCachedRankings = rankingCache.getRankings(concursoId, page, limit);
    
    // if (localCachedRankings) {
    //   logger.ranking('Rankings loaded from local cache', `concursoId: ${concursoId}, page: ${page}, count: ${localCachedRankings.length}`);
      
    //   const endTime = performance.now();
    //   logger.performance('fetchUserRankings (local cached)', endTime - startTime, 'RANKING_SERVICE');
      
    //   return localCachedRankings;
    // }
    
    // Query usando nova estrutura normalizada
    logger.ranking('Executing ranking query V2', `rankingId: ${concursoId}, offset: ${offset}, limit: ${limit}`);
    
    // Get all user_rankings and filter by concurso_id in consolidated_data
    const { data: allUserRankings, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        user_id,
        consolidated_data
      `);

    if (rankingError) {
      throw new Error(`Ranking query error: ${rankingError.message}`);
    }

    // Filter and format rankings for the specific concurso
    const rankingData = [];
    if (allUserRankings) {
      console.log('rankingService debug:', {
        allUserRankingsLength: allUserRankings.length,
        concursoId,
        firstUserRanking: allUserRankings[0] ? {
          userId: allUserRankings[0].user_id,
          hasConsolidatedData: !!allUserRankings[0].consolidated_data,
          consolidatedDataKeys: allUserRankings[0].consolidated_data ? Object.keys(allUserRankings[0].consolidated_data) : []
        } : null
      });
      
      // Get user IDs for profile lookup
      const userIds = allUserRankings.map(ur => ur.user_id);
      
      // Fetch user profiles separately
      const { data: userProfiles, error: profileError } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      
      console.log('rankingService profile debug:', {
        userIds,
        userProfiles,
        profileError,
        profileCount: userProfiles?.length || 0
      });
      
      // Create a map for quick profile lookup
      const profileMap = new Map();
      if (userProfiles && userProfiles.length > 0) {
        userProfiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }
      
      // Se não encontrou todos os perfis, buscar individualmente
      if (profileMap.size < userIds.length) {
        console.warn(`Found ${profileMap.size} profiles out of ${userIds.length}, searching for missing ones...`);
        for (const userId of userIds) {
          if (!profileMap.has(userId)) {
            try {
              const { data: individualProfile } = await supabase
                .from('users_profiles')
                .select('id, name, avatar_url')
                .eq('id', userId)
                .single();
              
              if (individualProfile) {
                profileMap.set(userId, individualProfile);
                console.log(`Found individual profile for ${userId}:`, individualProfile.name);
              } else {
                console.warn(`No profile found for ${userId}`);
              }
            } catch (err) {
              console.warn(`Failed to fetch individual profile for ${userId}:`, err);
            }
          }
        }
      }
      
      console.log('rankingService profileMap debug:', {
        profileMapSize: profileMap.size,
        profileMapKeys: Array.from(profileMap.keys()),
        profileMapValues: Array.from(profileMap.values()),
        expectedUserIds: userIds
      });
      
      // Process rankings sequentially to handle async operations
      for (const userRanking of allUserRankings) {
        if (userRanking.consolidated_data?.rankings) {
          for (const [rankingId, rankingDataItem] of Object.entries(userRanking.consolidated_data.rankings)) {
            console.log('rankingService filtering debug:', {
              rankingId,
              rankingDataItemConcursoId: rankingDataItem.concurso_id,
              concursoId,
              matches: rankingDataItem.concurso_id === concursoId
            });
            
            if (rankingDataItem.concurso_id === concursoId) {
              const userProfile = profileMap.get(userRanking.user_id);
              
              if (!userProfile) {
                console.error(`CRITICAL: Profile not found for user ${userRanking.user_id}`);
                console.error('Available profiles:', Array.from(profileMap.keys()));
                console.error('Looking for:', userRanking.user_id);
                continue; // Skip this ranking if no profile found
              }
              
              console.log('rankingService userProfile debug:', {
                userId: userRanking.user_id,
                userProfile,
                foundInMap: profileMap.has(userRanking.user_id),
                profileMapKeys: Array.from(profileMap.keys())
              });
              
              // Debug da nova estrutura
              console.log('rankingService new structure debug:', {
                rankingId,
                userId: userRanking.user_id,
                score: rankingDataItem.user_data?.score,
                subjectScoresTot: rankingDataItem.user_data?.subject_scores_tot,
                subjectiveScores: rankingDataItem.user_data?.subjective_scores,
                subjectives: rankingDataItem.user_data?.subjectives,
                subjectScores: rankingDataItem.user_data?.subject_scores,
                // Debug completo do user_data
                userData: rankingDataItem.user_data,
                // Debug de todas as chaves do user_data
                userDataKeys: rankingDataItem.user_data ? Object.keys(rankingDataItem.user_data) : 'no user_data'
              });

              console.log('rankingService userId debug:', {
                rankingId,
                userRankingUserId: userRanking.user_id,
                userProfileName: userProfile.name
              });

              // Debug log para reservation_type
              console.log('rankingService reservation_type debug:', {
                rankingId,
                user_data: rankingDataItem.user_data,
                reservation_type: rankingDataItem.user_data?.reservation_type,
                reservation_type_outside: rankingDataItem.reservation_type
              });

              rankingData.push({
                id: rankingId,
                position: 0, // Will be calculated later
                name: userProfile.name,
                score: rankingDataItem.user_data?.score || 0,
                userId: userRanking.user_id,
                avatarUrl: userProfile.avatar_url,
                // Pontuações subjetivas (nova estrutura)
                discursiveScore: rankingDataItem.user_data?.subjectives?.discursive || 0,
                caseStudy1Score: rankingDataItem.user_data?.subjectives?.case_study_1 || 0,
                caseStudy2Score: rankingDataItem.user_data?.subjectives?.case_study_2 || 0,
                caseStudy3Score: rankingDataItem.user_data?.subjectives?.case_study_3 || 0,
                otherSubjectiveScore: rankingDataItem.user_data?.subjectives?.other_subjective || 0,
                // Pontuações subjetivas com peso (mesmo valor, pois não há mais pesos)
                weightedDiscursiveScore: rankingDataItem.user_data?.subjectives?.discursive || 0,
                weightedCaseStudy1Score: rankingDataItem.user_data?.subjectives?.case_study_1 || 0,
                weightedCaseStudy2Score: rankingDataItem.user_data?.subjectives?.case_study_2 || 0,
                weightedCaseStudy3Score: rankingDataItem.user_data?.subjectives?.case_study_3 || 0,
                weightedOtherSubjectiveScore: rankingDataItem.user_data?.subjectives?.other_subjective || 0,
                // Pontuações de disciplinas customizadas (apenas as que começam com custom_)
                customDisciplineScores: Object.fromEntries(
                  Object.entries(rankingDataItem.user_data?.subject_scores || {})
                    .filter(([key]) => key.startsWith('custom_'))
                ),
                weightedCustomDisciplineScores: Object.fromEntries(
                  Object.entries(rankingDataItem.user_data?.subject_scores || {})
                    .filter(([key]) => key.startsWith('custom_'))
                ),
                // Flags de mínimos não atingidos
                belowMinimum: false, // Will be calculated later
                belowDisciplineMinimums: [],
                belowBlockMinimums: [],
                // Campos adicionais
                reservationType: rankingDataItem.user_data?.reservation_type || 'Ampla Concorrência',
                displayReservation: rankingDataItem.user_data?.reservation_type || 'Ampla Concorrência',
                quotaPosition: 0 // Will be calculated later
              });
            }
          }
        }
      }
    }

    // Sort by score and apply pagination
    rankingData.sort((a, b) => b.score - a.score);
    const paginatedData = rankingData.slice(offset, offset + limit);

    logger.ranking('Query result', `data: ${paginatedData?.length || 0} records, error: ${rankingError?.message || 'none'}`);

    if (rankingError) {
      throw new Error(`Ranking query error: ${rankingError.message}`);
    }

    if (!paginatedData || paginatedData.length === 0) {
      logger.ranking('No rankings found', `concursoId: ${concursoId}`);
      return [];
    }

    // Buscar dados do ranking (nova estrutura)
    const { data: rankingInfo, error: rankingInfoError } = await supabase
      .from('concursos')
      .select('id, subjects')
      .eq('id', concursoId)
      .single();

    if (rankingInfoError) {
      logger.warn('Could not fetch ranking data', 'RANKING_SERVICE', rankingInfoError);
    }

    // Obter dados do ranking
    const subjects = rankingInfo?.subjects || {};
    const hasMinimumScoreEnabled = subjects.discr || subjects.case1 || subjects.case2 || subjects.case3 || subjects.other;
    const totalMinimumScore = hasMinimumScoreEnabled ? (subjects.discr_min_score || subjects.case1_min_score || subjects.case2_min_score || subjects.case3_min_score || subjects.other_min_score || 0) : 0;

    // Formatar os dados do ranking com posições (nova estrutura normalizada)
    const formattedRankings = paginatedData.map((ranking, index) => {
      const name = ranking.name || 'Usuário Anônimo';
      const avatarUrl = ranking.avatarUrl || null;

      // Verificação de mínimos (simplificada para nova estrutura)
      const belowMinimum = ranking.score <= 0 || 
        (hasMinimumScoreEnabled && totalMinimumScore > 0 && ranking.score < totalMinimumScore);
    
      return {
        position: offset + index + 1, // Calcular posição baseada no índice
        name: name,
        score: ranking.score || 0,
        userId: ranking.userId,
        avatarUrl: avatarUrl,
        // Pontuações subjetivas (da nova estrutura)
        discursiveScore: ranking.discursiveScore || 0,
        caseStudy1Score: ranking.caseStudy1Score || 0,
        caseStudy2Score: ranking.caseStudy2Score || 0,
        caseStudy3Score: ranking.caseStudy3Score || 0,
        otherSubjectiveScore: ranking.otherSubjectiveScore || 0,
        // Pontuações subjetivas com peso (da nova estrutura)
        weightedDiscursiveScore: ranking.weightedDiscursiveScore || 0,
        weightedCaseStudy1Score: ranking.weightedCaseStudy1Score || 0,
        weightedCaseStudy2Score: ranking.weightedCaseStudy2Score || 0,
        weightedCaseStudy3Score: ranking.weightedCaseStudy3Score || 0,
        weightedOtherSubjectiveScore: ranking.weightedOtherSubjectiveScore || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores: ranking.customDisciplineScores || {},
        weightedCustomDisciplineScores: ranking.weightedCustomDisciplineScores || {},
        // Flags de mínimos não atingidos (valores padrão já que as colunas não existem)
        belowMinimum: belowMinimum,
        belowDisciplineMinimums: [],
        belowBlockMinimums: [],
        // Dados do ranking
        reservationType: ranking.user_data?.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(ranking.user_data?.reservation_type || 'Ampla Concorrência'),
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
