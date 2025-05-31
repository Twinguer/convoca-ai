
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

/**
 * Função para salvar gabarito por caderno específico
 */
export const saveBookletAnswerKey = async (concursoId: string, bookletId: string, answerKeyData: any[]) => {
  try {
    console.log(`Salvando gabarito do caderno ${bookletId} com ${answerKeyData.length} questões`);
    
    // Deletar gabarito existente para este caderno específico
    const { error: deleteError } = await supabase
      .from('official_answer_weights')
      .delete()
      .eq('concurso_id', concursoId)
      .eq('booklet_id', bookletId);
    
    if (deleteError) {
      console.error('Erro ao deletar gabarito existente do caderno:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // Inserir novo gabarito para este caderno
    const { data, error } = await supabase
      .from('official_answer_weights')
      .insert(answerKeyData);
    
    if (error) {
      console.error('Erro ao inserir gabarito do caderno:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Gabarito do caderno ${bookletId} salvo com sucesso`);
    return { success: true, data };
  } catch (error: any) {
    console.error('Erro no saveBookletAnswerKey:', error);
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

// Exportar os métodos como um objeto de serviço
export const answerKeyService = {
  getAnswerKeyForBooklet,
  getAnswerKey,
  saveBookletAnswerKey
};

// Este export default é necessário para compatibilidade com imports existentes
export default answerKeyService;
