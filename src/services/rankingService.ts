
import { supabase } from '@/integrations/supabase/client';

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  basicKnowledgeScore?: number;
  specificKnowledgeScore?: number; 
  discursiveScore?: number;
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    console.log('Fetching rankings for concurso:', concursoId);
    
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        discursive_score,
        users_profiles (name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) {
      console.error('Error in fetchUserRankings query:', error);
      throw error;
    }
    
    console.log('Rankings data fetched:', data);
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform the data to match the Ranking interface
    const rankings = data.map((item, index) => {
      // Get the user profile data
      const userProfile = item.users_profiles;
      console.log('User profile data for user:', item.user_id, userProfile);
      
      // Default values
      let name = 'Usuário Anônimo';
      let avatarUrl: string | null = null;
      
      // Handle different possible structures of userProfile with proper TypeScript type checking
      if (userProfile) {
        if (typeof userProfile === 'object' && !Array.isArray(userProfile)) {
          // Single object case
          const profile = userProfile as { name?: string; avatar_url?: string };
          name = profile.name || 'Usuário Anônimo';
          avatarUrl = profile.avatar_url || null;
        } 
        else if (Array.isArray(userProfile) && userProfile.length > 0) {
          // Array case
          const profile = userProfile[0] as { name?: string; avatar_url?: string };
          if (profile) {
            name = profile.name || 'Usuário Anônimo';
            avatarUrl = profile.avatar_url || null;
          }
        }
      }
      
      return {
        position: index + 1,
        name: name,
        score: item.score || 0,
        userId: item.user_id,
        avatarUrl: avatarUrl,
        basicKnowledgeScore: item.basic_knowledge_score || 0,
        specificKnowledgeScore: item.specific_knowledge_score || 0,
        discursiveScore: item.discursive_score || 0
      };
    });
    
    console.log('Transformed rankings:', rankings);
    return rankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};
