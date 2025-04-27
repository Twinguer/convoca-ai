
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { toast } from 'sonner';

// Create ranking
export const createRanking = async (rankingData: Partial<Concurso>, userId: string) => {
  try {
    // Add created_by to data
    const data = {
      ...rankingData,
      created_by_user_id: userId,
    };

    const { data: newRanking, error } = await supabase
      .from('concursos')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return newRanking;
  } catch (error: any) {
    toast.error(`Erro ao criar ranking: ${error.message}`);
    throw error;
  }
};

// Delete ranking (only by the creator)
export const deleteRanking = async (concursoId: string, userId: string) => {
  try {
    // First check if user is the creator
    const { data: ranking, error: fetchError } = await supabase
      .from('concursos')
      .select('created_by_user_id')
      .eq('id', concursoId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (ranking?.created_by_user_id !== userId) {
      throw new Error('Você não tem permissão para excluir este ranking.');
    }

    // Delete all answers related to this concurso
    await supabase
      .from('user_answers')
      .delete()
      .in('user_ranking_id', 
        supabase
          .from('user_rankings')
          .select('id')
          .eq('concurso_id', concursoId)
      );

    // Delete all user rankings for this concurso
    await supabase
      .from('user_rankings')
      .delete()
      .eq('concurso_id', concursoId);

    // Delete answer keys for this concurso
    await supabase
      .from('answer_keys')
      .delete()
      .eq('concurso_id', concursoId);
      
    // Delete weighted answers for this concurso
    await supabase
      .from('official_answer_weights')
      .delete()
      .eq('concurso_id', concursoId);

    // Delete the concurso itself
    const { error } = await supabase
      .from('concursos')
      .delete()
      .eq('id', concursoId);

    if (error) throw error;
  } catch (error: any) {
    toast.error(`Erro ao excluir ranking: ${error.message}`);
    throw error;
  }
};

// Update ranking (only by the creator)
export const updateRanking = async (concursoId: string, rankingData: Partial<Concurso>, userId: string) => {
  try {
    // First check if user is the creator
    const { data: ranking, error: fetchError } = await supabase
      .from('concursos')
      .select('created_by_user_id')
      .eq('id', concursoId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (ranking?.created_by_user_id !== userId) {
      throw new Error('Você não tem permissão para atualizar este ranking.');
    }

    // Update the ranking
    const { data: updatedRanking, error } = await supabase
      .from('concursos')
      .update(rankingData)
      .eq('id', concursoId)
      .select()
      .single();

    if (error) throw error;
    return updatedRanking;
  } catch (error: any) {
    toast.error(`Erro ao atualizar ranking: ${error.message}`);
    throw error;
  }
};
