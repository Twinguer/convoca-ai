import { supabase } from '@/integrations/supabase/client';
import { isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

/**
 * Atualiza os tipos de seção para o gabarito de um concurso
 */
export const updateSectionTypeForConcurso = async (concursoId: string) => {
  try {
    console.log(`[updateSectionTypeForConcurso] Iniciando atualização para concurso: ${concursoId}`);
    
    // Obter informações do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('has_custom_knowledge, disciplines')
      .eq('id', concursoId)
      .single();

    if (concursoError || !concurso) {
      console.error('[updateSectionTypeForConcurso] Erro ao buscar concurso:', concursoError);
      return {
        success: false,
        error: 'Concurso não encontrado'
      };
    }

    // Verificar se é estrutura hierárquica
    const hierarchical = isHierarchicalStructure(concurso);
    console.log(`[updateSectionTypeForConcurso] Concurso ${concursoId} usa estrutura hierárquica? ${hierarchical}`);

    // REMOVIDO: A chamada para update_section_types que estava causando erro 404
    // A função não existe no banco de dados e não é necessária para o funcionamento
    
    return {
      success: true,
      message: 'Section type verificado com sucesso'
    };

  } catch (error: any) {
    console.error('[updateSectionTypeForConcurso] Erro inesperado:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado ao atualizar section type'
    };
  }
};

// Função para extrair tipos de disciplina de um concurso
export const extractDisciplineTypes = async (concursoId: string) => {
  try {
    // Obter o concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      console.error('Erro ao buscar concurso:', concursoError);
      return { success: false, error: concursoError.message };
    }

    // Verificar se estamos usando estrutura hierárquica
    const hierarchical = isHierarchicalStructure(concurso);
    
    // Extrair tipos de disciplina
    const disciplineTypes: Array<{type: string, name: string}> = [];
    
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      if (hierarchical) {
        // Estrutura hierárquica (blocos -> disciplinas)
        for (const item of concurso.disciplines) {
          if ('disciplines' in item && Array.isArray(item.disciplines)) {
            const block = item;
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                disciplineTypes.push({
                  type: discipline.type,
                  name: discipline.name
                });
              }
            }
          }
        }
      } else {
        // Estrutura plana
        for (const item of concurso.disciplines) {
          if ('isEnabled' in item && item.isEnabled && item.type) {
            disciplineTypes.push({
              type: item.type,
              name: item.name
            });
          }
        }
      }
    }
    
    console.log(`[extractDisciplineTypes] Encontrados ${disciplineTypes.length} tipos de disciplina`);
    return { success: true, disciplineTypes };
    
  } catch (error: any) {
    console.error('Error extracting discipline types:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Função para obter o gabarito de um concurso
export const getAnswerKey = async (concursoId: string) => {
  try {
    const { data, error } = await supabase.rpc(
      'get_official_answer_weights',
      {
        p_concurso_id: concursoId,
      }
    );

    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error retrieving answer key:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Função para salvar o gabarito e recalcular pontuações
export const saveAnswerKeyAndRecalculate = async (concursoId: string, answerKeyData: any[]) => {
  try {
    // Use a RPC para atualizar o gabarito e recalcular as pontuações
    const { data, error } = await supabase.rpc(
      'update_official_answers_and_recalculate',
      {
        p_concurso_id: concursoId,
        p_answers_data: answerKeyData
      }
    );
    
    if (error) {
      console.error('Error saving answer key:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, updatedCount: data?.updated_count || 0 };
  } catch (error: any) {
    console.error('Error in saveAnswerKeyAndRecalculate:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Função para inserir gabarito diretamente - alternativa caso a RPC falhe
export const insertAnswersDirectly = async (concursoId: string, answerKeyData: any[]) => {
  try {
    // Deletar registros existentes
    const { error: deleteError } = await supabase
      .from('official_answer_weights')
      .delete()
      .eq('concurso_id', concursoId);
    
    if (deleteError) {
      console.error('Error deleting existing answer key:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // Inserir novos registros
    const { data, error } = await supabase
      .from('official_answer_weights')
      .insert(answerKeyData);
    
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
  updateSectionTypeForConcurso,
  extractDisciplineTypes,
  getAnswerKey,
  saveAnswerKeyAndRecalculate,
  insertAnswersDirectly
};

// Este export default é necessário para compatibilidade com imports existentes
export default answerKeyService;
