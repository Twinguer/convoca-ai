
import { SupabaseClient } from '@supabase/supabase-js';

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (supabase: SupabaseClient, concursoId: string) => {
  try {
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
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        user_id,
        reservation_type,
        users_profiles!inner(name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
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
        score: item.score,
        userId: item.user_id,
        avatarUrl: avatarUrl,
        basicKnowledgeScore: item.basic_knowledge_score,
        specificKnowledgeScore: item.specific_knowledge_score,
        specific1Score: item.specific_knowledge_1_score,
        specific2Score: item.specific_knowledge_2_score,
        specific3Score: item.specific_knowledge_3_score,
        discursiveScore: item.discursive_score,
        caseStudy1Score: item.case_study_1_score,
        caseStudy2Score: item.case_study_2_score,
        caseStudy3Score: item.case_study_3_score,
        // Add weighted scores
        weightedBasicScore: item.weighted_basic_score,
        weightedSpecific1Score: item.weighted_specific_1_score,
        weightedSpecific2Score: item.weighted_specific_2_score,
        weightedSpecific3Score: item.weighted_specific_3_score,
        weightedDiscursiveScore: item.weighted_discursive_score,
        weightedCaseStudy1Score: item.weighted_case_study_1_score,
        weightedCaseStudy2Score: item.weighted_case_study_2_score,
        weightedCaseStudy3Score: item.weighted_case_study_3_score,
        reservationType: item.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(item.reservation_type || 'Ampla Concorrência'),
        id: item.id
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  
  // Get first three letters as abbreviation
  const abbr = reservationType.substring(0, 3).toUpperCase();
  return abbr;
};
