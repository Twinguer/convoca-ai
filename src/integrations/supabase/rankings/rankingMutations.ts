
import { supabase } from '../client';
import { Concurso } from '@/types/concursos';

// Helper function to safely handle numeric values
const ensureNumeric = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
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

    // Remover campos que não existem mais no modelo
    const dataFormValues = { ...formValues };
    
    // Garantir que disciplines é um array válido
    if (!dataFormValues.disciplines) {
      dataFormValues.disciplines = [];
    }

    // Validar e processar disciplinas customizadas
    if (dataFormValues.has_custom_knowledge === true && Array.isArray(dataFormValues.disciplines)) {
      dataFormValues.disciplines = dataFormValues.disciplines.map((discipline: any) => {
        return {
          ...discipline,
          questionCount: ensureNumeric(discipline.questionCount),
          weight: ensureNumeric(discipline.weight),
          isEnabled: discipline.isEnabled === true
        };
      });
    }
    
    // Converter campos numéricos adequadamente
    const numericFields = [
      'basic_knowledge_questions', 'specific_knowledge_1_questions', 
      'specific_knowledge_2_questions', 'specific_knowledge_3_questions',
      'basic_knowledge_weight', 'specific_knowledge_1_weight',
      'specific_knowledge_2_weight', 'specific_knowledge_3_weight',
      'discursive_weight', 'case_study_1_weight',
      'case_study_2_weight', 'case_study_3_weight',
      'alternatives_count', 'wrong_answer_penalty'
    ];

    // Criar objeto limpo com dados para submissão
    const dataToSubmit: Record<string, any> = {
      ...dataFormValues,
      created_by_user_id: dataFormValues.created_by_user_id || userId, // Manter criador original quando admin está editando
      has_custom_knowledge: dataFormValues.has_custom_knowledge === true
    };
    
    // Definir explicitamente título e órgão
    if (title) dataToSubmit.titulo = title;
    if (orgao) dataToSubmit.orgao = orgao;
    if (dataFormValues.banca || dataFormValues.custom_banca) {
      dataToSubmit.banca = dataFormValues.custom_banca || dataFormValues.banca;
    }

    // Converter todos os campos numéricos
    numericFields.forEach(field => {
      if (field in dataToSubmit) {
        dataToSubmit[field] = ensureNumeric(dataToSubmit[field]);
      }
    });

    // Log para verificar o que estamos enviando
    console.log('Submitting data to Supabase:', 
      JSON.stringify({
        ...dataToSubmit,
        has_custom_knowledge: dataToSubmit.has_custom_knowledge,
        disciplines: dataToSubmit.disciplines,
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
