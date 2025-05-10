
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion, isValidSectionType, getDisciplineWeight } from '@/integrations/supabase/rankings/examStructure';
import { Concurso } from '@/types/concursos';
import { toast } from 'sonner';

interface AnswerKeyItem {
  concurso_id: string;
  question_number: number;
  correct_answer: string;
  weight: number;
  section_type: string;
  is_nullified: boolean;
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

// Função atualizada para verificar se o tipo de seção é válido
const sanitizeSectionType = (sectionType: string, concurso: Concurso): string => {
  // Verificar se o tipo é um tipo válido para este concurso
  if (isValidSectionType(sectionType, concurso)) {
    return sectionType; // Retornar o tipo original se for válido
  }
  
  console.warn(`Section type "${sectionType}" não é válido para este concurso. Usando "specific1" como fallback.`);
  return 'specific1'; // Fallback para compatibilidade
};

export const answerKeyService = {
  // Função para salvar o gabarito e recalcular pontuações
  async saveAnswerKeyAndRecalculate(concursoId: string, answerKeyData: AnswerKeyItem[]) {
    try {
      console.log(`[answerKeyService] Iniciando salvamento de gabarito para concurso: ${concursoId}`);
      console.log(`[answerKeyService] Total de questões a salvar: ${answerKeyData.length}`);
      
      // Obter o concurso para validação de tipos de seção
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (concursoError) {
        console.error('[answerKeyService] Erro ao buscar concurso:', concursoError);
        throw concursoError;
      }
      
      // Registrar todas as questões que vamos salvar para debug
      answerKeyData.forEach((item, index) => {
        // Garantir que section_type seja válido para este concurso
        item.section_type = sanitizeSectionType(item.section_type, concurso);
        
        // Calcular o peso correto para o tipo de seção
        const sectionWeight = getDisciplineWeight(item.section_type, concurso);
        if (sectionWeight !== item.weight) {
          console.log(`[answerKeyService] Ajustando peso da questão ${item.question_number} de ${item.weight} para ${sectionWeight} (tipo: ${item.section_type})`);
          item.weight = sectionWeight;
        }
        
        console.log(`[answerKeyService] Questão ${index + 1}:`, {
          numero: item.question_number,
          resposta: item.correct_answer,
          seção: item.section_type,
          peso: item.weight,
          anulada: item.is_nullified
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
        console.log(`[answerKeyService] Processando questão ${item.question_number}, resposta: ${item.correct_answer}, seção: ${item.section_type}, peso: ${item.weight}`);
        
        const { data, error } = await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: item.concurso_id,
          p_question_number: item.question_number,
          p_correct_answer: item.correct_answer,
          p_weight: item.weight,
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
        .select('question_number, correct_answer, section_type, weight')
        .eq('concurso_id', concursoId);

      if (verifyError) {
        console.error('[answerKeyService] Erro ao verificar salvamento:', verifyError);
        throw verifyError;
      }

      console.log(`[answerKeyService] Verificação: ${verifyData?.length || 0} questões encontradas no banco`);
      if (verifyData) {
        verifyData.forEach(item => {
          console.log(`[answerKeyService] Questão ${item.question_number}: ${item.correct_answer} (seção: ${item.section_type}, peso: ${item.weight})`);
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
      
      // Obter o concurso para validação de tipos de seção
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (concursoError) {
        console.error('[answerKeyService] Erro ao buscar concurso:', concursoError);
        throw concursoError;
      }
      
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
      const insertData = answerKeyData.map(item => {
        // Validar e sanitizar o tipo de seção
        const sectionType = sanitizeSectionType(item.section_type, concurso);
        
        // Obter o peso correto para esta seção/disciplina
        const weight = getDisciplineWeight(sectionType, concurso);
        
        return {
          concurso_id: item.concurso_id,
          question_number: item.question_number,
          correct_answer: item.correct_answer,
          weight: weight, // Usar o peso calculado da disciplina
          is_nullified: item.is_nullified || false,
          section_type: sectionType
        };
      });
      
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
