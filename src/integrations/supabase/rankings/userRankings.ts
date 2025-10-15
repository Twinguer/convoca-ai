import { SupabaseClient } from '@supabase/supabase-js';

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (supabase: SupabaseClient, concursoId: string) => {
  try {
    // console.log("[userRankings] Buscando rankings para concurso ID:", concursoId);
    
    // Buscar todos os user_rankings com consolidated_data
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

    // Filtrar rankings para o concurso específico
    const rankingsForConcurso = [];
    if (allUserRankings) {
      allUserRankings.forEach(userRanking => {
        if (userRanking.consolidated_data?.rankings) {
          Object.entries(userRanking.consolidated_data.rankings).forEach(([rankingId, rankingData]: [string, any]) => {
            if (rankingData.concurso_id === concursoId) {
              rankingsForConcurso.push({
                id: rankingId,
                user_id: userRanking.user_id,
                ...rankingData
              });
            }
          });
        }
      });
    }

    if (rankingsForConcurso.length === 0) {
      // console.log("[userRankings] Nenhum ranking encontrado para o concurso");
      return [];
    }

    // Buscar perfis dos usuários
    const userIds = rankingsForConcurso.map(r => r.user_id);
    const { data: userProfiles, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.error("[userRankings] Erro ao buscar perfis:", profileError);
      throw profileError;
    }

    // Criar mapa de perfis para lookup rápido
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Ordenar por score
    rankingsForConcurso.sort((a, b) => (b.user_data?.score || 0) - (a.user_data?.score || 0));
    
    // console.log(`[userRankings] ${rankingsForConcurso.length} rankings encontrados`);
    
    // Format the data with position
    return rankingsForConcurso.map((item, index) => {
      const userProfile = profileMap.get(item.user_id) || { name: 'Usuário', avatar_url: null };
      
      return {
        id: item.id,
        position: index + 1,
        name: userProfile.name,
        score: item.user_data?.score || 0,
        userId: item.user_id,
        avatarUrl: userProfile.avatar_url,
        reservationType: item.user_data?.reservation_type || 'Ampla Concorrência',
        displayReservation: item.user_data?.reservation_type || 'Ampla Concorrência',
        // Pontuações subjetivas
        discursiveScore: item.user_data?.subjective_scores?.discursive_score || 0,
        caseStudy1Score: item.user_data?.subjective_scores?.case_study_1_score || 0,
        caseStudy2Score: item.user_data?.subjective_scores?.case_study_2_score || 0,
        caseStudy3Score: item.user_data?.subjective_scores?.case_study_3_score || 0,
        otherSubjectiveScore: item.user_data?.subjective_scores?.other_subjective_score || 0,
        // Pontuações com peso (mesmo valor, pois não há mais pesos)
        weightedDiscursiveScore: item.user_data?.subjective_scores?.discursive_score || 0,
        weightedCaseStudy1Score: item.user_data?.subjective_scores?.case_study_1_score || 0,
        weightedCaseStudy2Score: item.user_data?.subjective_scores?.case_study_2_score || 0,
        weightedCaseStudy3Score: item.user_data?.subjective_scores?.case_study_3_score || 0,
        weightedOtherSubjectiveScore: item.user_data?.subjective_scores?.other_subjective_score || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores: item.user_data?.subject_scores || {},
        weightedCustomDisciplineScores: item.user_data?.subject_scores || {},
        // Flags de eliminação (padrão: não eliminado)
        belowMinimum: false,
        belowDisciplineMinimums: [],
        belowBlockMinimums: [],
      };
    });
    
  } catch (error) {
    console.error("[userRankings] Error fetching rankings with user info:", error);
    throw error;
  }
};