
import { supabase } from '@/integrations/supabase/client';
import { Concurso, ConcursoFilter, UserRanking } from '@/types/concursos';

export const fetchConcursos = async (filters?: ConcursoFilter): Promise<Concurso[]> => {
  try {
    let query = supabase
      .from('concursos')
      .select('*');

    // Apply filters if they exist
    if (filters) {
      if (filters.status && filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }
      if (filters.orgao && filters.orgao !== 'Todos') {
        query = query.eq('orgao', filters.orgao);
      }
      if (filters.banca && filters.banca !== 'Todos') {
        query = query.eq('banca', filters.banca);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching concursos:', error);
    return [];
  }
};

export const fetchConcursoById = async (id: string): Promise<Concurso | null> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching concurso by ID:', error);
    return null;
  }
};

export const getParticipantCount = async (concursoId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('user_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('concurso_id', concursoId);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching participant count:', error);
    return 0;
  }
};

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string;
  basicKnowledgeScore?: number;
  specificKnowledgeScore?: number; 
  discursiveScore?: number;
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
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
      
    if (error) throw error;
    
    // Transform the data to match the Ranking interface
    const rankings = data.map((item, index) => {
      // Fix: Correctly access the nested users_profiles object
      // In Supabase joins, the related table data can be returned as a single object or an array with one item
      const userProfile = Array.isArray(item.users_profiles) 
        ? item.users_profiles[0] 
        : item.users_profiles;
      
      return {
        position: index + 1,
        name: userProfile?.name || 'Usuário Anônimo',
        score: item.score || 0,
        userId: item.user_id,
        avatarUrl: userProfile?.avatar_url,
        basicKnowledgeScore: item.basic_knowledge_score || 0,
        specificKnowledgeScore: item.specific_knowledge_score || 0,
        discursiveScore: item.discursive_score || 0
      };
    });
    
    return rankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// Function to update user scores
export const updateUserScores = async (
  rankingId: string, 
  userId: string, 
  basicKnowledgeScore: number, 
  specificKnowledgeScore: number, 
  discursiveScore: number
): Promise<boolean> => {
  try {
    const totalScore = basicKnowledgeScore + specificKnowledgeScore + discursiveScore;
    
    const { data, error } = await supabase.rpc('admin_operations', {
      operation: 'update_user_scores',
      data: {
        ranking_id: rankingId,
        user_id: userId,
        basic_knowledge_score: basicKnowledgeScore,
        specific_knowledge_score: specificKnowledgeScore,
        discursive_score: discursiveScore,
        total_score: totalScore
      }
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user scores:', error);
    return false;
  }
};

// New function to fetch all user rankings for any concurso
export const fetchUserConcursoRankings = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        concurso_id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        discursive_score,
        concursos (
          titulo,
          orgao,
          banca
        )
      `)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user concurso rankings:', error);
    return [];
  }
};

// Function to get a user's position in a specific concurso
export const getUserRankingPosition = async (userId: string, concursoId: string): Promise<number> => {
  try {
    // First get all rankings for this concurso ordered by score
    const { data, error } = await supabase
      .from('user_rankings')
      .select('user_id, score')
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    // Find the user's position in the rankings
    const position = data.findIndex(ranking => ranking.user_id === userId);
    
    return position >= 0 ? position + 1 : 0; // +1 because array indices start at 0
  } catch (error) {
    console.error('Error getting user ranking position:', error);
    return 0;
  }
};

// Fix the scheduleScraper function to ensure it's properly exported
export const scheduleScraper = async (): Promise<void> => {
  try {
    console.log('Scheduling scraper for concursos...');
    // This would typically make an API call to schedule scraping
    // For now, we'll just log that it was called
  } catch (error) {
    console.error('Error scheduling scraper:', error);
  }
};
