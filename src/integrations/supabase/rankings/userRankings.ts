
import { supabase } from '../client';

// Extending the return type to include all the fields we'll need
interface RankingWithUserInfo {
  position: number;
  name: string | unknown;
  score: number;
  userId: string;
  avatarUrl: string | null | unknown;
  basicKnowledgeScore?: number;
  specificKnowledgeScore?: number;
  specificKnowledge1Score?: number;
  specificKnowledge2Score?: number;
  specificKnowledge3Score?: number;
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  reservationType?: string;
  displayReservation?: string;
}

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (concursoId: string): Promise<RankingWithUserInfo[]> => {
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
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        reservation_type,
        user_id,
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
      // Fix: Correctly access nested properties
      const userProfile = item.users_profiles || {};
      
      // Safely access properties with type checking
      const name = typeof userProfile === 'object' && userProfile !== null && 'name' in userProfile 
        ? userProfile.name 
        : 'Unknown User';
        
      const avatarUrl = typeof userProfile === 'object' && userProfile !== null && 'avatar_url' in userProfile 
        ? userProfile.avatar_url 
        : null;
      
      // Get reservation type and create display reservation
      const reservationType = item.reservation_type || 'Ampla Concorrência';
      const displayReservation = reservationType !== 'Ampla Concorrência' 
        ? reservationType.substring(0, 3).toUpperCase() 
        : '';
      
      return {
        position: index + 1,
        name: name,
        score: item.score,
        userId: item.user_id,
        avatarUrl: avatarUrl,
        basicKnowledgeScore: item.basic_knowledge_score,
        specificKnowledgeScore: item.specific_knowledge_score,
        specificKnowledge1Score: item.specific_knowledge_1_score,
        specificKnowledge2Score: item.specific_knowledge_2_score,
        specificKnowledge3Score: item.specific_knowledge_3_score,
        discursiveScore: item.discursive_score,
        caseStudy1Score: item.case_study_1_score,
        caseStudy2Score: item.case_study_2_score,
        caseStudy3Score: item.case_study_3_score,
        reservationType: reservationType,
        displayReservation: displayReservation
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};
