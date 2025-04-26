
import { supabase } from '../client';

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (concursoId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        concurso_id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        specific_knowledge_1_score,
        specific_knowledge_2_score,
        specific_knowledge_3_score,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        weighted_basic_score,
        weighted_specific_1_score,
        weighted_specific_2_score,
        weighted_specific_3_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        user_id,
        users_profiles!inner(name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Format the data with camelCase property names for consistency
    return data.map((item) => {
      // Fix: Correctly access nested properties
      const userProfile = item.users_profiles || {};
      
      // Safely access properties with type checking
      const name = typeof userProfile === 'object' && userProfile !== null && 'name' in userProfile 
        ? userProfile.name 
        : 'Unknown User';
        
      const avatarUrl = typeof userProfile === 'object' && userProfile !== null && 'avatar_url' in userProfile 
        ? userProfile.avatar_url 
        : null;
      
      return {
        concursoId: item.concurso_id,
        userId: item.user_id,
        score: item.score,
        name: name,
        avatarUrl: avatarUrl,
        // Store both snake_case for backward compatibility
        basic_knowledge_score: item.basic_knowledge_score,
        specific_knowledge_score: item.specific_knowledge_score,
        specific_knowledge_1_score: item.specific_knowledge_1_score,
        specific_knowledge_2_score: item.specific_knowledge_2_score,
        specific_knowledge_3_score: item.specific_knowledge_3_score,
        discursive_score: item.discursive_score,
        case_study_1_score: item.case_study_1_score,
        case_study_2_score: item.case_study_2_score,
        case_study_3_score: item.case_study_3_score,
        // Add weighted scores
        weighted_basic_score: item.weighted_basic_score,
        weighted_specific_1_score: item.weighted_specific_1_score, 
        weighted_specific_2_score: item.weighted_specific_2_score,
        weighted_specific_3_score: item.weighted_specific_3_score,
        weighted_discursive_score: item.weighted_discursive_score,
        weighted_case_study_1_score: item.weighted_case_study_1_score,
        weighted_case_study_2_score: item.weighted_case_study_2_score,
        weighted_case_study_3_score: item.weighted_case_study_3_score,
        // Also add camelCase versions
        basicKnowledgeScore: item.basic_knowledge_score,
        specificKnowledgeScore: item.specific_knowledge_score,
        specificKnowledge1Score: item.specific_knowledge_1_score,
        specificKnowledge2Score: item.specific_knowledge_2_score,
        specificKnowledge3Score: item.specific_knowledge_3_score,
        discursiveScore: item.discursive_score,
        caseStudy1Score: item.case_study_1_score,
        caseStudy2Score: item.case_study_2_score,
        caseStudy3Score: item.case_study_3_score,
        // Add weighted scores in camelCase 
        weightedBasicScore: item.weighted_basic_score,
        weightedSpecific1Score: item.weighted_specific_1_score,
        weightedSpecific2Score: item.weighted_specific_2_score,
        weightedSpecific3Score: item.weighted_specific_3_score,
        weightedDiscursiveScore: item.weighted_discursive_score,
        weightedCaseStudy1Score: item.weighted_case_study_1_score,
        weightedCaseStudy2Score: item.weighted_case_study_2_score,
        weightedCaseStudy3Score: item.weighted_case_study_3_score
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};
