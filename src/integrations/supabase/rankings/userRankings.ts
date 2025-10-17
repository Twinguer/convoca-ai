import { SupabaseClient } from '@supabase/supabase-js';

/**
 * DEPRECATED: Esta função usa a estrutura antiga de user_rankings
 * Use fetchUserRankingsV3 de rankingServiceV3.ts para queries otimizadas
 */
export const getRankingsWithUserInfo = async (supabase: SupabaseClient, concursoId: string) => {
  console.warn('[userRankings] DEPRECATED: Use fetchUserRankingsV3 from rankingServiceV3.ts');
  
  try {
    // Get all user_rankings and filter by concurso_id in consolidated_data
    const { data: allUserRankings, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        user_id,
        consolidated_data
      `);

    if (rankingError) {
      console.error("[userRankings] Erro ao buscar user_rankings:", rankingError);
      throw rankingError;
    }

    if (!allUserRankings || allUserRankings.length === 0) {
      return [];
    }
    
    // Filter and format rankings for the specific concurso
    const rankingData = [];
    
    // Get user IDs for profile lookup
    const userIds = allUserRankings.map(ur => ur.user_id);
    
    // Fetch user profiles
    const { data: userProfiles, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
    
    if (profileError) {
      console.error("[userRankings] Erro ao buscar profiles:", profileError);
    }
    
    // Create a map for quick profile lookup
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }
    
    // Process rankings
    for (const userRanking of allUserRankings) {
      if (userRanking.consolidated_data?.rankings) {
        for (const [rankingId, rankingDataItem] of Object.entries(userRanking.consolidated_data.rankings)) {
          if (rankingDataItem.concurso_id === concursoId) {
            const userProfile = profileMap.get(userRanking.user_id);
            
            if (!userProfile) {
              console.warn(`[userRankings] Profile not found for user ${userRanking.user_id}`);
              continue;
            }
            
            rankingData.push({
              id: rankingId,
              position: 0, // Will be calculated later
              name: userProfile.name || 'Usuário',
              score: rankingDataItem.user_data?.score || 0,
              userId: userRanking.user_id,
              avatarUrl: userProfile.avatar_url,
              reservationType: rankingDataItem.user_data?.reservation_type || 'Ampla Concorrência',
              displayReservation: rankingDataItem.user_data?.reservation_type || 'Ampla Concorrência',
              // Pontuações subjetivas
              discursiveScore: rankingDataItem.user_data?.subjectives?.discursive || 0,
              caseStudy1Score: rankingDataItem.user_data?.subjectives?.case_study_1 || 0,
              caseStudy2Score: rankingDataItem.user_data?.subjectives?.case_study_2 || 0,
              caseStudy3Score: rankingDataItem.user_data?.subjectives?.case_study_3 || 0,
              otherSubjectiveScore: rankingDataItem.user_data?.subjectives?.other_subjective || 0,
              // Pontuações com peso (mesmo valor)
              weightedDiscursiveScore: rankingDataItem.user_data?.subjectives?.discursive || 0,
              weightedCaseStudy1Score: rankingDataItem.user_data?.subjectives?.case_study_1 || 0,
              weightedCaseStudy2Score: rankingDataItem.user_data?.subjectives?.case_study_2 || 0,
              weightedCaseStudy3Score: rankingDataItem.user_data?.subjectives?.case_study_3 || 0,
              weightedOtherSubjectiveScore: rankingDataItem.user_data?.subjectives?.other_subjective || 0,
              // Pontuações de disciplinas customizadas
              customDisciplineScores: rankingDataItem.user_data?.object_scores || {},
              weightedCustomDisciplineScores: rankingDataItem.user_data?.object_scores || {},
              // Flags de eliminação (padrão: não eliminado)
              belowMinimum: false,
              belowDisciplineMinimums: [],
              belowBlockMinimums: [],
            });
          }
        }
      }
    }
    
    // Sort by score and calculate positions
    rankingData.sort((a, b) => b.score - a.score);
    rankingData.forEach((ranking, index) => {
      ranking.position = index + 1;
    });
    
    return rankingData;
    
  } catch (error) {
    console.error("[userRankings] Error fetching rankings with user info:", error);
    throw error;
  }
};