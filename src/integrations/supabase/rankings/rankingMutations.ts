
import { supabase } from '../client';
import { Concurso } from '@/types/concursos';

// Helper function to safely handle JSONB fields
const processJsonbField = (value: any): any => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value; // Already an object
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('Failed to parse string as JSON:', e);
      return value; // Return as is if can't parse
    }
  }
  return value; // Return as is for numbers or other types
};

// Função para salvar um novo ranking ou atualizar um existente
export const saveRanking = async (
  formValues: Partial<Concurso>, 
  userId: string | undefined, 
  editId?: string | null
): Promise<{id?: string; duplicated?: boolean; error?: boolean}> => {
  try {
    // Normalizar strings para verificação de unicidade (tratando maiúsculas/minúsculas e espaços)
    const normalize = (str: string) => (str || "").replace(/\s+/g, " ").trim().toUpperCase();

    // Truncar títulos longos para melhor exibição
    let title = formValues.custom_job_title || formValues.predefined_job_title || '';
    if (title && title.length > 30) {
      title = title.substring(0, 30) + '...';
    }
    
    // Truncar nome de órgão longo para melhor exibição
    let orgao = formValues.orgao || '';
    if (orgao && orgao.length > 30) {
      orgao = orgao.substring(0, 30) + '...';
    }

    // Buscar concursos existentes e fazer a comparação de unicidade em JS
    const { data: founds, error: findError } = await supabase
      .from('concursos')
      .select('id, titulo, orgao, banca, data_publicacao')
      .eq('data_publicacao', formValues.data_publicacao);

    if (findError) throw findError;

    // Não verificar duplicatas ao editar como administrador
    const isAdminEditing = editId && formValues.is_admin_update;
    
    const isDuplicate = !editId && !isAdminEditing && founds?.some(item =>
      normalize(item.titulo) === normalize(title) &&
      normalize(item.orgao) === normalize(orgao) &&
      normalize(item.banca) === normalize(formValues.custom_banca || formValues.banca || '')
    );

    if (isDuplicate) {
      return { duplicated: true };
    }

    // Garantir que has_custom_knowledge e disciplines são explicitamente removidos
    delete formValues.has_custom_knowledge;
    delete formValues.disciplines;
    delete formValues.custom_knowledge_questions;
    delete formValues.custom_knowledge_weight;

    // Criar objeto limpo com dados para submissão
    const dataToSubmit: Record<string, any> = {
      ...formValues,
      created_by_user_id: formValues.created_by_user_id || userId, // Manter criador original quando admin está editando
      titulo: title,
      orgao: orgao,
      banca: formValues.custom_banca || formValues.banca,
      has_custom_knowledge: false // Explicitamente definir como false
    };

    // Log to see what we're submitting
    console.log('Submitting data to Supabase:', 
      JSON.stringify({
        ...dataToSubmit,
        basic_knowledge_questions_type: typeof dataToSubmit.basic_knowledge_questions
      }, null, 2)
    );

    let result;
    
    if (editId) {
      const { data, error } = await supabase
        .from('concursos')
        .update(dataToSubmit)
        .eq('id', editId)
        .select();

      if (error) throw error;
      result = data;
      return { id: editId };
    } else {
      const { data, error } = await supabase.from('concursos').insert(dataToSubmit).select();
      if (error) throw error;
      result = data;
      return { id: result?.[0]?.id };
    }
  } catch (error) {
    console.error("Erro ao salvar ranking:", error);
    return { error: true };
  }
};

// Função para salvar o gabarito oficial
export const saveOfficialAnswers = async (
  concursoId: string,
  answers: Array<{ questionNumber: number; answer: string; weight?: number; isNullified?: boolean }>
) => {
  try {
    for (const answer of answers) {
      await supabase.rpc('update_answer_with_weight', {
        p_concurso_id: concursoId,
        p_question_number: answer.questionNumber,
        p_correct_answer: answer.answer,
        p_weight: answer.weight || 1.0,
        p_is_nullified: answer.isNullified || false
      });
    }
    return true;
  } catch (error) {
    console.error('Erro ao salvar gabarito oficial:', error);
    return false;
  }
};

// Outras funções de mutação relacionadas a rankings...
