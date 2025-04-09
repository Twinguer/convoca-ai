import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';

export const fetchConcursos = async (): Promise<Concurso[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('*');

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
        users_profiles!inner (name)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    // Transform the data to match the Ranking interface
    const rankings = data.map((item, index) => ({
      position: index + 1,
      name: item.users_profiles?.name || 'Usuário Anônimo',
      score: item.score,
      userId: item.user_id
    }));
    
    return rankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};
