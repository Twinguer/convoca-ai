
import { supabase } from '@/integrations/supabase/client';
import { answerKeyLogger as logger } from './answerKeyLogger';
import { AnswerKeyItem, SaveAnswerKeyResult } from './types';

/**
 * Função para inserir respostas diretamente sem recalcular pontuações
 * Útil para importação massiva de dados
 */
export const insertAnswersDirectly = async (
  concursoId: string, 
  answerKeyData: AnswerKeyItem[]
): Promise<SaveAnswerKeyResult> => {
  try {
    logger.info(`Iniciando inserção direta de gabarito para concurso: ${concursoId}`);
    logger.info(`Total de questões a inserir: ${answerKeyData.length}`);
    
    // Verificar se já existem respostas no gabarito
    const { data: existingAnswers, error: checkError } = await supabase
      .from('official_answer_weights')
      .select('question_number')
      .eq('concurso_id', concursoId);

    if (checkError) {
      logger.error('Erro ao verificar gabarito existente:', checkError);
      throw checkError;
    }
    
    const existingQuestionsSet = new Set(existingAnswers?.map(a => a.question_number) || []);
    const answersToInsert = answerKeyData.filter(item => !existingQuestionsSet.has(item.question_number));
    
    logger.info(`Questões já existentes: ${existingAnswers?.length || 0}`);
    logger.info(`Questões novas a inserir: ${answersToInsert.length}`);
    
    if (answersToInsert.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        insertedCount: 0
      };
    }
    
    // Preparar dados para inserção em lote
    const bulkData = answersToInsert.map(item => ({
      concurso_id: concursoId,
      question_number: item.question_number,
      correct_answer: item.correct_answer,
      weight: item.weight || 1.0,
      is_nullified: item.is_nullified || false,
      section_type: item.section_type || 'specific1', // Usar um valor padrão se não fornecido
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    // Inserir em lote
    const { data: insertResult, error: insertError } = await supabase
      .from('official_answer_weights')
      .insert(bulkData);
      
    if (insertError) {
      logger.error('Erro ao inserir gabarito em lote:', insertError);
      throw insertError;
    }
    
    return {
      success: true,
      insertedCount: answersToInsert.length
    };
  } catch (error) {
    logger.error('Erro ao inserir gabarito diretamente:', error);
    return {
      success: false,
      error: (error as Error).message,
      insertedCount: 0
    };
  }
};
