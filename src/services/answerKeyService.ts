
import { supabase } from '@/integrations/supabase/client';
import { isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

/**
 * Função para obter o gabarito de um concurso por caderno
 */
export const getAnswerKeyForBooklet = async (concursoId: string, bookletId: string) => {
  try {
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', concursoId)
      .eq('booklet_id', bookletId);

    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error retrieving answer key for booklet:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Função para obter o gabarito de um concurso
export const getAnswerKey = async (concursoId: string) => {
  try {
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', concursoId);

    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error retrieving answer key:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Função para salvar o gabarito com recálculo automático
export const saveAnswerKeyAndRecalculate = async (concursoId: string, bookletId: string, answerKeyData: any[]) => {
  try {
    // Deletar gabarito existente para este caderno
    const { error: deleteError } = await supabase
      .from('official_answer_weights')
      .delete()
      .eq('concurso_id', concursoId)
      .eq('booklet_id', bookletId);
    
    if (deleteError) {
      console.error('Error deleting existing answer key:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // Inserir novo gabarito
    const { data, error } = await supabase
      .from('official_answer_weights')
      .insert(answerKeyData.map(item => ({
        ...item,
        booklet_id: bookletId
      })));
    
    if (error) {
      console.error('Error saving answer key:', error);
      return { success: false, error: error.message };
    }
    
    // Tentar recalcular pontuações (usando função existente)
    try {
      const { data: recalcData, error: recalcError } = await supabase.rpc(
        'recalculate_all_scores_with_weights',
        { p_concurso_id: concursoId }
      );
      
      if (recalcError) {
        console.error('Error recalculating scores:', recalcError);
        // Não falha o salvamento se o recálculo der erro
        return { success: true, updatedCount: 0, recalcError: recalcError.message };
      }
      
      return { success: true, updatedCount: recalcData?.updatedCount || 0 };
    } catch (recalcError) {
      console.error('Error in recalculation:', recalcError);
      return { success: true, updatedCount: 0, recalcError: 'Erro no recálculo' };
    }
  } catch (error: any) {
    console.error('Error in saveAnswerKeyAndRecalculate:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Função para inserir gabarito diretamente - alternativa caso a RPC falhe
export const insertAnswersDirectly = async (concursoId: string, bookletId: string, answerKeyData: any[]) => {
  try {
    // Deletar registros existentes para este caderno
    const { error: deleteError } = await supabase
      .from('official_answer_weights')
      .delete()
      .eq('concurso_id', concursoId)
      .eq('booklet_id', bookletId);
    
    if (deleteError) {
      console.error('Error deleting existing answer key:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // Inserir novos registros
    const { data, error } = await supabase
      .from('official_answer_weights')
      .insert(answerKeyData.map(item => ({
        ...item,
        booklet_id: bookletId
      })));
    
    if (error) {
      console.error('Error inserting new answers:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in insertAnswersDirectly:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Exportar os métodos como um objeto de serviço
export const answerKeyService = {
  getAnswerKeyForBooklet,
  getAnswerKey,
  saveAnswerKeyAndRecalculate,
  insertAnswersDirectly
};

// Este export default é necessário para compatibilidade com imports existentes
export default answerKeyService;
