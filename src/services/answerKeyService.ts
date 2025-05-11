
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion, sanitizeSectionType } from '@/integrations/supabase/rankings/examStructure';
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
      
      console.log(`Atualizando questão ${question.question_number} para section_type: ${sectionType}`);
      
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

export const answerKeyService = {
  // Função para salvar o gabarito e recalcular pontuações
  async saveAnswerKeyAndRecalculate(concursoId: string, answerKeyData: AnswerKeyItem[]) {
    try {
      console.log(`[answerKeyService] Iniciando salvamento de gabarito para concurso: ${concursoId}`);
      console.log(`[answerKeyService] Total de questões a salvar: ${answerKeyData.length}`);
      
      // Primeiro obter o concurso para ter acesso às disciplinas customizadas
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (concursoError) {
        console.error('[answerKeyService] Erro ao obter concurso:', concursoError);
        throw concursoError;
      }
      
      // Registrar todas as questões que vamos salvar para debug
      answerKeyData.forEach((item, index) => {
        // Determine the correct section type for this question
        const correctedSectionType = getSectionTypeForQuestion(concurso, item.question_number);
        
        // Ensure the section type is properly formatted with custom_ prefix if needed
        item.section_type = sanitizeSectionType(correctedSectionType);
        
        console.log(`[answerKeyService] Questão ${index + 1}:`, {
          numero: item.question_number,
          resposta: item.correct_answer,
          seção: item.section_type,
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

      // Processar cada questão individualmente para identificar erros específicos
      const errors = [];
      
      for (const item of answerKeyData) {
        try {
          console.log(`[answerKeyService] Processando questão ${item.question_number}, resposta: ${item.correct_answer}, seção: ${item.section_type}`);
          
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
            errors.push(`Questão ${item.question_number}: ${error.message}`);
            // Continue trying other questions despite errors
          } else {
            console.log(`[answerKeyService] Questão ${item.question_number} salva com sucesso`);
          }
        } catch (error) {
          console.error(`[answerKeyService] Exceção ao salvar questão ${item.question_number}:`, error);
          errors.push(`Questão ${item.question_number}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Verificar se houve erros
      if (errors.length > 0) {
        console.error('[answerKeyService] Erros ao salvar gabarito:', errors);
        // Throw comprehensive error with all question-specific errors
        throw new Error(`Erros ao salvar questões: ${errors.join(', ')}`);
      }

      // Verificar se os dados foram realmente salvos
      const { data: verifyData, error: verifyError } = await supabase
        .from('official_answer_weights')
        .select('question_number, correct_answer, section_type')
        .eq('concurso_id', concursoId);

      if (verifyError) {
        console.error('[answerKeyService] Erro ao verificar salvamento:', verifyError);
        throw verifyError;
      }

      console.log(`[answerKeyService] Verificação: ${verifyData?.length || 0} questões encontradas no banco`);
      if (verifyData) {
        verifyData.forEach(item => {
          console.log(`[answerKeyService] Questão ${item.question_number}: ${item.correct_answer}, seção: ${item.section_type}`);
        });
      }

      // Try to recalculate all scores
      try {
        const { data: recalcResult, error: recalcError } = await supabase.rpc(
          'recalculate_all_scores',
          { p_concurso_id: concursoId }
        );

        if (recalcError) {
          console.error('[answerKeyService] Erro ao recalcular pontuações:', recalcError);
          // Don't throw here, we'll return success for saving the answers
        } else {
          console.log('[answerKeyService] Pontuações recalculadas com sucesso:', recalcResult);
        }
      } catch (error) {
        console.error('[answerKeyService] Erro ao chamar recalculate_all_scores:', error);
        // Don't throw here, we'll return success for saving the answers
      }

      return {
        success: true,
        updatedCount: verifyData?.length || 0
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
      
      // Primeiro obter o concurso para ter acesso às disciplinas customizadas
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (concursoError) {
        console.error('[answerKeyService] Erro ao obter concurso:', concursoError);
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
        // Determinar o tipo de seção correto baseado na estrutura do concurso
        const correctedSectionType = getSectionTypeForQuestion(concurso, item.question_number);
        
        // Sanitizar o tipo de seção para evitar problemas com restrições de banco de dados
        const sanitizedSectionType = sanitizeSectionType(correctedSectionType);
        
        return {
          concurso_id: item.concurso_id,
          question_number: item.question_number,
          correct_answer: item.correct_answer,
          weight: item.weight || 1.0,
          is_nullified: item.is_nullified || false,
          section_type: sanitizedSectionType
        };
      });
      
      // Registrar os section_types para debug
      insertData.forEach(item => {
        console.log(`[answerKeyService] Questão ${item.question_number} com section_type: ${item.section_type}`);
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
