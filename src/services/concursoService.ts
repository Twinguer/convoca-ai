
import { supabase } from '@/integrations/supabase/client';
import { Concurso, ConcursoFilter } from '@/types/concursos';

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
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        users_profiles (name)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    // Transform the data to match the Ranking interface
    // Fix here: Correctly access the nested users_profiles.name property
    const rankings = data.map((item, index) => ({
      position: index + 1,
      name: item.users_profiles?.[0]?.name || 'Usuário Anônimo',
      score: item.score,
      userId: item.user_id
    }));
    
    return rankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
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
