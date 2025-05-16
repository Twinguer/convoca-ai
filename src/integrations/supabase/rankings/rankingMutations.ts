
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
      .select('id, titulo, orgao, banca, custom_banca, data_publicacao')
      .eq('data_publicacao', formValues.data_publicacao);

    if (findError) throw findError;

    // Não verificar duplicatas ao editar como administrador
    const isAdminEditing = editId && formValues.is_admin_update;
    
    const isDuplicate = !editId && !isAdminEditing && founds?.some(item =>
      normalize(item.titulo) === normalize(title) &&
      normalize(item.orgao) === normalize(orgao) &&
      normalize(item.custom_banca || item.banca || '') === normalize(formValues.custom_banca || formValues.banca || '')
    );

    if (isDuplicate) {
      return { duplicated: true };
    }

    // Remover campos que não existem mais no modelo
    const dataFormValues = { ...formValues };
    
    // Processar os blocos de disciplinas e garantir que as pontuações mínimas sejam numéricas
    if (dataFormValues.disciplines && Array.isArray(dataFormValues.disciplines)) {
      // Processar todos os blocos
      dataFormValues.disciplines = dataFormValues.disciplines.map((block: any) => {
        // Garantir que o mínimo do bloco é um número
        const blockMinimumScore = ensureNumeric(block.minimum_score);
        
        // Processar todas as disciplinas do bloco
        if (block.disciplines && Array.isArray(block.disciplines)) {
          block.disciplines = block.disciplines.map((discipline: any) => {
            // Garantir que o mínimo da disciplina é um número
            const disciplineMinimumScore = ensureNumeric(discipline.minimum_score);
            
            return {
              ...discipline,
              questionCount: ensureNumeric(discipline.questionCount),
              weight: ensureNumeric(discipline.weight),
              isEnabled: discipline.isEnabled === true,
              minimum_score: disciplineMinimumScore
            };
          });
        }
        
        return {
          ...block,
          minimum_score: blockMinimumScore
        };
      });
    }
    
    // Garantir que disciplines é um array válido
    if (!dataFormValues.disciplines) {
      dataFormValues.disciplines = [];
    }

    // Validar e processar disciplinas customizadas
    if (Array.isArray(dataFormValues.disciplines)) {
      // Verificar se pelo menos uma disciplina está habilitada
      let hasEnabledDiscipline = false;
      
      // Verificar em todos os blocos
      for (const block of dataFormValues.disciplines) {
        if (block && typeof block === 'object' && 'disciplines' in block && Array.isArray(block.disciplines)) {
          // Verificar cada disciplina no bloco
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled === true) {
              hasEnabledDiscipline = true;
              break;
            }
          }
        }
        if (hasEnabledDiscipline) break;
      }
      
      if (!hasEnabledDiscipline && dataFormValues.disciplines.length > 0) {
        throw new Error("Você precisa habilitar pelo menos uma disciplina quando usar conhecimentos customizados");
      }
    }
    
    // Converter campos numéricos adequadamente
    const numericFields = [
      'basic_knowledge_questions', 'specific_knowledge_1_questions', 
      'specific_knowledge_2_questions', 'specific_knowledge_3_questions',
      'basic_knowledge_weight', 'specific_knowledge_1_weight',
      'specific_knowledge_2_weight', 'specific_knowledge_3_weight',
      'discursive_weight', 'case_study_1_weight',
      'case_study_2_weight', 'case_study_3_weight',
      'alternatives_count', 'wrong_answer_penalty',
      'total_minimum_score'
    ];

    // Criar objeto limpo com dados para submissão
    const dataToSubmit: Record<string, any> = {
      ...dataFormValues,
      created_by_user_id: dataFormValues.created_by_user_id || userId, // Manter criador original quando admin está editando
      has_custom_knowledge: true // Sempre usar conhecimento customizado (disciplinas)
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
    
    // Garantir que temos um valor para pontuação mínima geral
    if (!dataToSubmit.total_minimum_score) {
      dataToSubmit.total_minimum_score = 0;
    }

    // Desabilitar conhecimentos básicos/específicos padrão
    dataToSubmit.has_basic_knowledge = false;
    dataToSubmit.has_specific_knowledge_1 = false;
    dataToSubmit.has_specific_knowledge_2 = false;
    dataToSubmit.has_specific_knowledge_3 = false;

    // Log para verificar o que estamos enviando
    console.log('Submitting data to Supabase:', 
      JSON.stringify({
        disciplines: dataToSubmit.disciplines,
        has_custom_knowledge: dataToSubmit.has_custom_knowledge,
        total_minimum_score: dataToSubmit.total_minimum_score
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
