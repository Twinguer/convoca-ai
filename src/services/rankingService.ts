
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
  reservationType?: string;
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    console.log('Fetching rankings for concurso:', concursoId);
    
    // First, get all rankings for the concurso
    const { data: rankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        discursive_score,
        reservation_type
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (rankingsError) {
      console.error('Error in fetchUserRankings query:', rankingsError);
      throw rankingsError;
    }
    
    // If no rankings, return empty array
    if (!rankings || rankings.length === 0) {
      return [];
    }
    
    // Now fetch the user profiles separately
    const userIds = rankings.map(ranking => ranking.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw profilesError;
    }
    
    console.log('User profiles data:', profiles);
    
    // Map the rankings with profile information
    const formattedRankings = rankings.map((ranking, index) => {
      // Find the matching profile
      const profile = profiles?.find(p => p.id === ranking.user_id);
      
      return {
        position: index + 1,
        name: profile?.name || 'Usuário Anônimo',
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: profile?.avatar_url || null,
        basicKnowledgeScore: ranking.basic_knowledge_score || 0,
        specificKnowledgeScore: ranking.specific_knowledge_score || 0,
        discursiveScore: ranking.discursive_score || 0,
        reservationType: ranking.reservation_type || 'Ampla Concorrência'
      };
    });
    
    console.log('Transformed rankings:', formattedRankings);
    return formattedRankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};
