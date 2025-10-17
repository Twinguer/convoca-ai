import { SupabaseClient } from '@supabase/supabase-js';

/**
 * DEPRECATED: Esta função usa a estrutura antiga de user_rankings
 * Use fetchUserRankingsV3 de rankingServiceV3.ts para queries otimizadas
 */
export const getRankingsWithUserInfo = async (supabase: SupabaseClient, concursoId: string) => {
  console.warn('[userRankings] DEPRECATED: Use fetchUserRankingsV3 from rankingServiceV3.ts');
  
  try {
    // Query otimizada usando as novas colunas desnormalizadas com JOIN
    const { data: rankings, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        *,
        users_profiles!inner(id, name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });

    if (rankingError) {
      console.error("[userRankings] Erro ao buscar user_rankings:", rankingError);
      throw rankingError;
    }

    if (!rankings || rankings.length === 0) {
      return [];
    }
    
    // Format the data with position usando a nova estrutura
    return rankings.map((item: any, index: number) => {
      const consolidatedData = item.consolidated_data || {};
      const subjectiveScores = consolidatedData.subjective_scores || {};
      const subjectScores = consolidatedData.subject_scores || {};
      
      return {
        id: item.id,
        position: index + 1,
        name: item.users_profiles.name || 'Usuário',
        score: item.score || 0,
        userId: item.user_id,
        avatarUrl: item.users_profiles.avatar_url,
        reservationType: item.reservation_type || 'Ampla Concorrência',
        displayReservation: item.reservation_type || 'Ampla Concorrência',
        // Pontuações subjetivas
        discursiveScore: subjectiveScores.discursive_score || 0,
        caseStudy1Score: subjectiveScores.case_study_1_score || 0,
        caseStudy2Score: subjectiveScores.case_study_2_score || 0,
        caseStudy3Score: subjectiveScores.case_study_3_score || 0,
        otherSubjectiveScore: subjectiveScores.other_subjective_score || 0,
        // Pontuações com peso (mesmo valor)
        weightedDiscursiveScore: subjectiveScores.discursive_score || 0,
        weightedCaseStudy1Score: subjectiveScores.case_study_1_score || 0,
        weightedCaseStudy2Score: subjectiveScores.case_study_2_score || 0,
        weightedCaseStudy3Score: subjectiveScores.case_study_3_score || 0,
        weightedOtherSubjectiveScore: subjectiveScores.other_subjective_score || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores: subjectScores,
        weightedCustomDisciplineScores: subjectScores,
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