
import { SupabaseClient } from '@supabase/supabase-js';

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (supabase: SupabaseClient, concursoId: string) => {
  try {
    console.log("[userRankings] Buscando rankings para concurso ID:", concursoId);
    
    // First, get the concurso details to check if it's subject-based
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      console.error("[userRankings] Erro ao buscar concurso:", concursoError);
      throw concursoError;
    }
    
    // Get all user rankings for this concurso
    const { data, error } = await supabase
      .from('user_rankings')      
      .select(`
        id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        specific_knowledge_1_score,
        specific_knowledge_2_score,
        specific_knowledge_3_score,
        discursive_score,
        weighted_basic_score,
        weighted_specific_1_score,
        weighted_specific_2_score,
        weighted_specific_3_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        user_id,
        reservation_type,
        users_profiles(name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) {
      console.error("[userRankings] Erro ao buscar rankings:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("[userRankings] Nenhum ranking encontrado para o concurso");
      return [];
    }
    
    console.log(`[userRankings] ${data.length} rankings encontrados`);
    
    // For subject-based concursos, also fetch subject scores
    let subjectScores: Record<string, any> = {};
    
    if (concurso.minimum_score_type === 'subject') {
      for (const item of data) {
        try {
          // Fetch subject scores for this ranking
          const { data: subjectData } = await supabase.rpc(
            'get_candidate_subject_scores',
            { p_ranking_id: item.id }
          );
          
          if (subjectData) {
            // Organize by subject code
            const scores: Record<string, number> = {};
            subjectData.forEach((s: any) => {
              if (s.subject_name) {
                scores[s.subject_name] = s.score;
              }
            });
            
            subjectScores[item.id] = scores;
          }
        } catch (subjectError) {
          console.error(`[userRankings] Error fetching subject scores for ranking ${item.id}:`, subjectError);
        }
      }
    }
    
    // Check quota minimum requirements if enabled
    let passedQuotaCheck: Record<string, boolean> = {};
    
    if (concurso.has_quota_minimum_score) {
      for (const item of data) {
        // Skip this check for Ampla Concorrência
        if (item.reservation_type === 'Ampla Concorrência') {
          passedQuotaCheck[item.id] = true;
          continue;
        }
        
        // Implement check using the isQuotaScoreBelowMinimum logic
        const totalScore = (
          (item.basic_knowledge_score || 0) +
          (item.specific_knowledge_1_score || 0) +
          (item.specific_knowledge_2_score || 0) +
          (item.specific_knowledge_3_score || 0)
        );
        
        const totalQuestions = (
          (concurso.basic_knowledge_questions || 0) +
          (concurso.specific_knowledge_1_questions || 0) +
          (concurso.specific_knowledge_2_questions || 0) +
          (concurso.specific_knowledge_3_questions || 0)
        );
        
        // Calculate if passes minimum requirement
        let passes = true;
        
        if (concurso.quota_minimum_score > 0) {
          if (concurso.quota_minimum_score_unit_type === 'percentage') {
            const scorePercentage = (totalScore / totalQuestions) * 100;
            passes = scorePercentage >= concurso.quota_minimum_score;
          } else {
            passes = totalScore >= concurso.quota_minimum_score;
          }
        }
        
        passedQuotaCheck[item.id] = passes;
      }
    } else {
      // If quota minimum check is not enabled, everyone passes
      for (const item of data) {
        passedQuotaCheck[item.id] = true;
      }
    }
    
    // Format the data with position
    return data.map((item, index) => {
      // Correctly handle users_profiles which could be an object or array
      const userProfile = Array.isArray(item.users_profiles) 
        ? item.users_profiles[0] 
        : item.users_profiles;
      
      // Safely access with optional chaining
      const name = userProfile?.name || 'Unknown User';
      const avatarUrl = userProfile?.avatar_url || null;
      
      // Check if disqualified due to quota minimum score
      const isDisqualified = !passedQuotaCheck[item.id];
      
      const result = {
        position: index + 1,
        name: name,
        score: item.score || 0,
        userId: item.user_id,
        id: item.id,
        avatarUrl: avatarUrl,
        basicKnowledgeScore: item.basic_knowledge_score || 0,
        specificKnowledgeScore: item.specific_knowledge_score || 0,
        specific1Score: item.specific_knowledge_1_score || 0,
        specific2Score: item.specific_knowledge_2_score || 0,
        specific3Score: item.specific_knowledge_3_score || 0,
        discursiveScore: item.discursive_score || 0,
        weightedBasicScore: item.weighted_basic_score || 0,
        weightedSpecific1Score: item.weighted_specific_1_score || 0,
        weightedSpecific2Score: item.weighted_specific_2_score || 0,
        weightedSpecific3Score: item.weighted_specific_3_score || 0,
        weightedDiscursiveScore: item.weighted_discursive_score || 0,
        weightedCaseStudy1Score: item.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: item.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: item.weighted_case_study_3_score || 0,
        reservationType: item.reservation_type || 'Ampla Concorrência',
        displayReservation: item.reservation_type || 'Ampla Concorrência',
        isQuotaDisqualified: isDisqualified
      };
      
      // Add subject scores if available
      if (concurso.minimum_score_type === 'subject' && subjectScores[item.id]) {
        // @ts-ignore - add subject scores dynamically
        result.subjectScores = subjectScores[item.id];
      }
      
      return result;
    });
    
  } catch (error) {
    console.error('[userRankings] Error fetching rankings with user info:', error);
    return [];
  }
};
