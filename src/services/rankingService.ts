
import { supabase } from '@/integrations/supabase/client';

// Type for a Ranking as expected in the codebase
export interface Ranking {
  id: string;
  userId: string;
  score: number;
  basicKnowledgeScore: number;
  specificKnowledgeScore: number;
  discursiveScore: number;
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('id, user_id, score, basic_knowledge_score, specific_knowledge_score, discursive_score')
      .eq('concurso_id', concursoId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      score: Number(item.score ?? 0),
      basicKnowledgeScore: Number(item.basic_knowledge_score ?? 0),
      specificKnowledgeScore: Number(item.specific_knowledge_score ?? 0),
      discursiveScore: Number(item.discursive_score ?? 0),
    }));
  } catch (error) {
    console.error('Error fetching user rankings:', error);
    return [];
  }
};
