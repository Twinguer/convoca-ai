
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
      // Corrigido: Acesso correto à propriedade aninhada users_profiles
      const userProfile = item.users_profiles;
      
      return {
        position: index + 1,
        name: userProfile ? userProfile.name : 'Unknown User',
        score: item.score,
        userId: item.user_id,
        avatarUrl: userProfile ? userProfile.avatar_url : null,
        basicKnowledgeScore: item.basic_knowledge_score,
        specificKnowledgeScore: item.specific_knowledge_score,
        specific1Score: item.specific_knowledge_1_score,
        specific2Score: item.specific_knowledge_2_score,
        specific3Score: item.specific_knowledge_3_score,
        discursiveScore: item.discursive_score
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};
