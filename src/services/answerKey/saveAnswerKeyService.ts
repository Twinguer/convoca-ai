
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';
import { answerKeyLogger as logger } from './answerKeyLogger';
import { AnswerKeyItem, SaveAnswerKeyResult } from './types';
import { Concurso } from '@/types/concursos';

/**
 * Função para salvar o gabarito e recalcular pontuações
 */
export const saveAnswerKeyAndRecalculate = async (
  concursoId: string, 
  answerKeyData: AnswerKeyItem[]
): Promise<SaveAnswerKeyResult> => {
  try {
    logger.info(`Iniciando salvamento de gabarito para concurso: ${concursoId}`);
    logger.info(`Total de questões a salvar: ${answerKeyData.length}`);
    
    // Primeiro obter o concurso para ter acesso às disciplinas customizadas
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      logger.error('Erro ao obter concurso:', concursoError);
      throw concursoError;
    }
    
    // Registrar todas as questões que vamos salvar para debug
    answerKeyData.forEach((item, index) => {
      // Determine the correct section type for this question
      // Usar apenas tipos válidos reconhecidos pelo banco de dados
      const correctedSectionType = getSectionTypeForQuestion(concurso, item.question_number);
      
      // Log para debug
      logger.debug(`Questão ${index + 1}: assigning section_type=${correctedSectionType} for question=${item.question_number}`);
      
      // Sempre atribuir section_type para garantir compatibilidade com o banco
      item.section_type = correctedSectionType;
      
      logger.debug(`Questão ${index + 1}:`, {
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
      logger.error('Erro ao verificar gabarito existente:', checkError);
      throw checkError;
    }
    
    logger.info(`Respostas existentes: ${existingAnswers?.length || 0}`);

    // Processar cada questão individualmente para identificar erros específicos
    const errors = [];
    
    for (const item of answerKeyData) {
      try {
        logger.info(`Processando questão ${item.question_number}, resposta: ${item.correct_answer}, seção: ${item.section_type}`);
        
        // Primeiro obter o concurso novamente para cada questão, para garantir que temos v_concurso
        // Isso resolve o erro "record v_concurso is not assigned yet"
        const { data: concurso, error: concursoError } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', concursoId)
          .single();
          
        if (concursoError) {
          logger.error('Erro ao obter concurso para questão:', concursoError);
          throw concursoError;
        }
        
        const { data, error } = await supabase.rpc('update_answer_with_weight', {
          p_concurso_id: item.concurso_id,
          p_question_number: item.question_number,
          p_correct_answer: item.correct_answer,
          p_weight: item.weight || 1.0,
          p_is_nullified: item.is_nullified || false,
          p_section_type: item.section_type
        });

        if (error) {
          logger.error(`Erro ao salvar questão ${item.question_number}:`, error);
          errors.push(`Questão ${item.question_number}: ${error.message}`);
          // Continue trying other questions despite errors
        } else {
          logger.info(`Questão ${item.question_number} salva com sucesso`);
        }
      } catch (error) {
        logger.error(`Exceção ao salvar questão ${item.question_number}:`, error);
        errors.push(`Questão ${item.question_number}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // Verificar se houve erros
    if (errors.length > 0) {
      logger.error('Erros ao salvar gabarito:', errors);
      // Throw comprehensive error with all question-specific errors
      throw new Error(`Erros ao salvar questões: ${errors.join(', ')}`);
    }

    // Verificar se os dados foram realmente salvos
    const { data: verifyData, error: verifyError } = await supabase
      .from('official_answer_weights')
      .select('question_number, correct_answer, section_type')
      .eq('concurso_id', concursoId);

    if (verifyError) {
      logger.error('Erro ao verificar salvamento:', verifyError);
      throw verifyError;
    }

    logger.info(`Verificação: ${verifyData?.length || 0} questões encontradas no banco`);
    if (verifyData) {
      verifyData.forEach(item => {
        logger.debug(`Questão ${item.question_number}: ${item.correct_answer}, seção: ${item.section_type}`);
      });
    }

    // Try to recalculate all scores
    try {
      const { data: recalcResult, error: recalcError } = await supabase.rpc(
        'recalculate_all_scores',
        { p_concurso_id: concursoId }
      );

      if (recalcError) {
        logger.error('Erro ao recalcular pontuações:', recalcError);
        // Don't throw here, we'll return success for saving the answers
      } else {
        logger.info('Pontuações recalculadas com sucesso:', recalcResult);
      }
    } catch (error) {
      logger.error('Erro ao chamar recalculate_all_scores:', error);
      // Don't throw here, we'll return success for saving the answers
    }

    return {
      success: true,
      updatedCount: verifyData?.length || 0
    };
  } catch (error) {
    logger.error('Erro ao salvar gabarito:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
};
