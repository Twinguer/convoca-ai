
import { supabase } from '@/integrations/supabase/client';
import { isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

/**
 * Atualiza os tipos de seção para o gabarito de um concurso
 */
export const updateSectionTypeForConcurso = async (concursoId: string) => {
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
    console.log(`[updateSectionTypeForConcurso] Concurso ${concursoId} usa estrutura hierárquica? ${hierarchical}`);

    // Chamar a função RPC existente para atualizar tipos de seção
    const { data, error } = await supabase.rpc('update_section_types', {
      p_concurso_id: concursoId,
      p_hierarchical: hierarchical // Passar o indicador de estrutura hierárquica
    });
    
    if (error) {
      console.error('Error updating section types:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating section types:', error);
    return { success: false, error: error.message || String(error) };
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
