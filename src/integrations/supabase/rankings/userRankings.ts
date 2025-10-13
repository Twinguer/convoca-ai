
import { SupabaseClient } from '@supabase/supabase-js';

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (supabase: SupabaseClient, concursoId: string) => {
  try {
    // console.log("[userRankings] Buscando rankings para concurso ID:", concursoId);
    
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
      // console.log("[userRankings] Nenhum ranking encontrado para o concurso");
      return [];
    }
    
    // console.log(`[userRankings] ${data.length} rankings encontrados`);
    
    // Format the data with position
    return data.map((item, index) => {
      // Corretamente tratar users_profiles que pode ser um objeto ou array
      const userProfile = Array.isArray(item.users_profiles) 
        ? item.users_profiles[0] 
        : item.users_profiles;
      
      // Usando acesso seguro com optional chaining
      const name = userProfile?.name || 'Unknown User';
      const avatarUrl = userProfile?.avatar_url || null;
      
      return {
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
        displayReservation: item.reservation_type || 'Ampla Concorrência'
      };
    });
    
  } catch (error) {
    console.error('[userRankings] Error fetching rankings with user info:', error);
    return [];
  }
};
