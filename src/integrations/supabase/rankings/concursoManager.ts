
import { supabase } from '../client';
import { toast } from 'sonner';

// Function to create a new ranking/concurso
export const createRanking = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('concursos')
      .insert([data])
      .select('id')
      .single();
    
    if (error) throw error;
    
    return result.id;
  } catch (error) {
    console.error('Error creating ranking:', error);
    toast.error('Erro ao criar ranking');
    throw error;
  }
};

// Function to update concurso information
export const updateConcurso = async (id, data) => {
  try {
    const { error } = await supabase
      .from('concursos')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Concurso atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating concurso:', error);
    toast.error('Erro ao atualizar concurso');
    throw error;
  }
};

// Function to delete a ranking
export const deleteRanking = async (concursoId, userId) => {
  try {
    // First check if the user is authorized to delete this ranking
    const { data: rankingData, error: rankingError } = await supabase
      .from('concursos')
      .select('creator_id')
      .eq('id', concursoId)
      .single();
    
    if (rankingError) throw rankingError;
    
    if (rankingData.creator_id !== userId) {
      toast.error('Você não tem permissão para excluir este ranking');
      throw new Error('Unauthorized');
    }
    
    // Delete all user rankings associated with this concurso
    const { error: userRankingsError } = await supabase
      .from('user_rankings')
      .delete()
      .eq('concurso_id', concursoId);
    
    if (userRankingsError) throw userRankingsError;
    
    // Delete the concurso itself
    const { error: concursoError } = await supabase
      .from('concursos')
      .delete()
      .eq('id', concursoId);
    
    if (concursoError) throw concursoError;
    
    toast.success('Ranking excluído com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting ranking:', error);
    toast.error('Erro ao excluir ranking');
    throw error;
  }
};

// Function to update answer key for a concurso
export const updateAnswerKey = async (concursoId, answerKeyData) => {
  try {
    const { error } = await supabase
      .from('answer_keys')
      .upsert({
        concurso_id: concursoId,
        answers: answerKeyData.answers,
        weights: answerKeyData.weights,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    toast.success('Gabarito atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating answer key:', error);
    toast.error('Erro ao atualizar gabarito');
    throw error;
  }
};
