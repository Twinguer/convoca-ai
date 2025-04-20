
import { Concurso, ConcursoFilter } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserRankings } from './rankingService';
import { getUserRankingPosition, fetchUserConcursoRankings, updateUserScores } from './userService';

export const fetchConcursos = async (filters?: ConcursoFilter): Promise<Concurso[]> => {
  try {
    let query = supabase
      .from('concursos')
      .select('*');

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

export const toggleQuestionNullification = async (
  concursoId: string,
  questionNumber: number,
  isNullified: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('answer_keys')
      .update({ is_nullified: isNullified })
      .eq('concurso_id', concursoId)
      .eq('question_number', questionNumber);

    if (error) {
      throw error;
    }

    // Import recalculateAllUserScores from proper location
    const { recalculateAllUserScores } = await import('@/integrations/supabase/rankings/userAnswers');
    await recalculateAllUserScores(concursoId);
  } catch (error) {
    console.error('Error toggling question nullification:', error);
    throw error;
  }
};

export { fetchUserRankings } from './rankingService';
export { getUserRankingPosition, fetchUserConcursoRankings, updateUserScores } from './userService';
export { scheduleScraper } from './scraperService';

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
