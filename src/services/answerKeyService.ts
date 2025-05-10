
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion, validSectionTypes, getCustomDisciplineType, getDisciplineWeight } from '@/integrations/supabase/rankings/examStructure';
import { Concurso } from '@/types/concursos';
import { toast } from 'sonner';

interface AnswerKeyItem {
  concurso_id: string;
  question_number: number;
  correct_answer: string;
  weight: number;
  section_type: string;
  is_nullified: boolean;
  custom_discipline_type?: string;
}

// Função para atualizar o tipo de seção para determinado concurso
export const updateSectionTypeForConcurso = async (
  concursoId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Primeiro obter o concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Obter todas as questões do gabarito oficial
    const { data: questions, error: questionsError } = await supabase
      .from('official_answer_weights')
      .select('id, question_number')
      .eq('concurso_id', concursoId);
      
    if (questionsError) throw questionsError;
    
    // Para cada questão, atualizar o section_type com base na função de mapeamento
    for (const question of questions || []) {
      const sectionType = getSectionTypeForQuestion(concurso, question.question_number);
      
      const { error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: sectionType })
        .eq('id', question.id);
        
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating section types:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Garantir que o tipo de seção seja válido para o banco de dados
const sanitizeSectionType = (sectionType: string): string => {
  // Verificar se o tipo de seção está na lista de tipos válidos
  if (validSectionTypes.includes(sectionType)) {
    return sectionType;
  }
  
  // Para tipos customizados, retornar 'custom'
  if (sectionType.startsWith('custom_')) {
    return 'custom';
  }
  
  // Caso contrário, retornar um valor padrão seguro
  console.warn(`Section type "${sectionType}" não é válido. Usando "specific1" como fallback.`);
  return 'specific1';
};

export const answerKeyService = {
  // Função para salvar o gabarito e recalcular pontuações
  async saveAnswerKeyAndRecalculate(concursoId: string, answerKeyData: AnswerKeyItem[]) {
    try {
      console.log(`[answerKeyService] Iniciando salvamento de gabarito para concurso: ${concursoId}`);
      console.log(`[answerKeyService] Total de questões a salvar: ${answerKeyData.length}`);
      
      // Buscar o concurso para ter acesso aos pesos e configuração de disciplinas
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
      
      if (concursoError) {
        throw new Error(`Erro ao buscar dados do concurso: ${concursoError.message}`);
      }
      
      // Registrar todas as questões que vamos salvar para debug
      answerKeyData.forEach((item, index) => {
        // Para disciplinas customizadas, determinar o tipo real
        if (concurso.has_custom_knowledge) {
          const customType = getCustomDisciplineType(concurso, item.question_number);
          if (customType) {
            // Armazenar o tipo real como metadado
            item.custom_discipline_type = customType;
            
            // Buscar o peso definido para essa disciplina
            const disciplineWeight = getDisciplineWeight(concurso, customType);
            // Só aplica o peso da disciplina se o peso da questão for padrão (1.0)
            if (item.weight === 1.0) {
              item.weight = disciplineWeight;
            }
          }
        }
        
        // Garantir que section_type seja válido
        item.section_type = sanitizeSectionType(item.section_type);
        
        console.log(`[answerKeyService] Questão ${index + 1}:`, {
          numero: item.question_number,
          resposta: item.correct_answer,
          seção: item.section_type,
          peso: item.weight,
          anulada: item.is_nullified,
          disciplinaCustom: item.custom_discipline_type || 'N/A'
        });
      });

      // Verificar se já existem respostas no gabarito
      const { data: existingAnswers, error: checkError } = await supabase
        .from('official_answer_weights')
        .select('question_number, correct_answer')
        .eq('concurso_id', concursoId);

      if (checkError) {
        console.error('[answerKeyService] Erro ao verificar gabarito existente:', checkError);
        throw checkError;
      }
      
      console.log(`[answerKeyService] Respostas existentes: ${existingAnswers?.length || 0}`);

      // Atualizar ou inserir cada questão do gabarito
      for (const item of answerKeyData) {
        // Garantir que section_type seja válido
        item.section_type = sanitizeSectionType(item.section_type);
        
        console.log(`[answerKeyService] Processando questão ${item.question_number}, resposta: ${item.correct_answer}, seção: ${item.section_type}, peso: ${item.weight}`);
        
        const { data, error } = await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: item.concurso_id,
          p_question_number: item.question_number,
          p_correct_answer: item.correct_answer,
          p_weight: item.weight || 1.0,
          p_is_nullified: item.is_nullified || false,
          p_section_type: item.section_type
        });

        if (error) {
          console.error(`[answerKeyService] Erro ao salvar questão ${item.question_number}:`, error);
          throw error;
        }
        
        console.log(`[answerKeyService] Questão ${item.question_number} salva com sucesso`);
      }

      // Verificar se os dados foram realmente salvos
      const { data: verifyData, error: verifyError } = await supabase
        .from('official_answer_weights')
        .select('question_number, correct_answer, weight')
        .eq('concurso_id', concursoId);

      if (verifyError) {
        console.error('[answerKeyService] Erro ao verificar salvamento:', verifyError);
        throw verifyError;
      }

      console.log(`[answerKeyService] Verificação: ${verifyData?.length || 0} questões encontradas no banco`);
      if (verifyData) {
        verifyData.forEach(item => {
          console.log(`[answerKeyService] Questão ${item.question_number}: ${item.correct_answer}, peso: ${item.weight}`);
        });
      }

      // Recalcular todas as pontuações
      const { data: recalcResult, error: recalcError } = await supabase.rpc(
        'recalculate_all_scores',
        { p_concurso_id: concursoId }
      );

      if (recalcError) {
        console.error('[answerKeyService] Erro ao recalcular pontuações:', recalcError);
        throw recalcError;
      }

      console.log('[answerKeyService] Pontuações recalculadas com sucesso:', recalcResult);
      return {
        success: true,
        updatedCount: recalcResult?.updatedCount || 0
      };
    } catch (error) {
      console.error('[answerKeyService] Erro ao salvar gabarito:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  // Função para obter o gabarito de um concurso
  async getAnswerKey(concursoId: string) {
    try {
      console.log(`[answerKeyService] Buscando gabarito do concurso: ${concursoId}`);
      
      const { data, error } = await supabase.rpc('get_official_answer_weights', {
        p_concurso_id: concursoId
      });

      if (error) {
        console.error('[answerKeyService] Erro ao buscar gabarito:', error);
        throw error;
      }

      console.log(`[answerKeyService] Gabarito encontrado:`, data);
      return {
        success: true,
        data: data || {}
      };
    } catch (error) {
      console.error('[answerKeyService] Erro ao buscar gabarito:', error);
      return {
        success: false,
        error: (error as Error).message,
        data: {}
      };
    }
  },
  
  // Nova função para inserir diretamente na tabela official_answer_weights
  async insertAnswersDirectly(concursoId: string, answerKeyData: AnswerKeyItem[]) {
    try {
      console.log(`[answerKeyService] Tentando inserir diretamente no banco de dados para concurso: ${concursoId}`);
      
      // Primeiro, remover registros existentes para este concurso para evitar conflitos
      const { error: deleteError } = await supabase
        .from('official_answer_weights')
        .delete()
        .eq('concurso_id', concursoId);
      
      if (deleteError) {
        console.error('[answerKeyService] Erro ao limpar gabarito existente:', deleteError);
        throw deleteError;
      }
      
      // Preparar dados para inserção e garantir que section_type seja válido
      const insertData = answerKeyData.map(item => ({
        concurso_id: item.concurso_id,
        question_number: item.question_number,
        correct_answer: item.correct_answer,
        weight: item.weight || 1.0,
        is_nullified: item.is_nullified || false,
        section_type: sanitizeSectionType(item.section_type)
      }));
      
      // Inserir todos os registros de uma vez
      const { data, error } = await supabase
        .from('official_answer_weights')
        .insert(insertData)
        .select();
      
      if (error) {
        console.error('[answerKeyService] Erro ao inserir gabarito diretamente:', error);
        throw error;
      }
      
      console.log(`[answerKeyService] Inserção direta: ${data?.length || 0} questões inseridas com sucesso`);
      
      return {
        success: true,
        insertedCount: data?.length || 0
      };
    } catch (error) {
      console.error('[answerKeyService] Erro na inserção direta:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
};
