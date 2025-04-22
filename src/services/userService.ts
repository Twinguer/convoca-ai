
import { supabase } from '@/integrations/supabase/client';

// Function to update user scores
export const updateUserScores = async (
  rankingId: string, 
  userId: string, 
  basicKnowledgeScore: number, 
  specificKnowledgeScore: number, 
  discursiveScore: number
): Promise<boolean> => {
  try {
    console.log(`[updateUserScores] Atualizando pontuações para ranking ${rankingId}, usuário ${userId}`);
    console.log(`[updateUserScores] Pontuações: básica=${basicKnowledgeScore}, específica=${specificKnowledgeScore}, discursiva=${discursiveScore}`);
    
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

    if (error) {
      console.error('[updateUserScores] Erro:', error);
      throw error;
    }
    
    console.log('[updateUserScores] Pontuações atualizadas com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating user scores:', error);
    return false;
  }
};

// Function to fetch all user rankings for any concurso
export const fetchUserConcursoRankings = async (userId: string): Promise<any[]> => {
  try {
    console.log(`[fetchUserConcursoRankings] Buscando rankings para usuário ${userId}`);
    
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
      
    if (error) {
      console.error('[fetchUserConcursoRankings] Erro:', error);
      throw error;
    }
    
    console.log(`[fetchUserConcursoRankings] Encontrados ${data?.length || 0} rankings`);
    return data || [];
  } catch (error) {
    console.error('Error fetching user concurso rankings:', error);
    return [];
  }
};

// Function to get a user's position in a specific concurso
export const getUserRankingPosition = async (userId: string, concursoId: string): Promise<number> => {
  try {
    console.log(`[getUserRankingPosition] Buscando posição do usuário ${userId} no concurso ${concursoId}`);
    
    // First get all rankings for this concurso ordered by score
    const { data, error } = await supabase
      .from('user_rankings')
      .select('user_id, score')
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) {
      console.error('[getUserRankingPosition] Erro:', error);
      throw error;
    }
    
    // Find the user's position in the rankings
    const position = data.findIndex(ranking => ranking.user_id === userId);
    
    console.log(`[getUserRankingPosition] Posição do usuário ${userId}: ${position >= 0 ? position + 1 : 0}`);
    return position >= 0 ? position + 1 : 0; // +1 because array indices start at 0
  } catch (error) {
    console.error('Error getting user ranking position:', error);
    return 0;
  }
};
