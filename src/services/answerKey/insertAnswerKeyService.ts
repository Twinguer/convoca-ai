
import { supabase } from '@/integrations/supabase/client';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';
import { answerKeyLogger as logger } from './answerKeyLogger';
import { AnswerKeyItem, SaveAnswerKeyResult } from './types';

/**
 * Função para inserir diretamente na tabela official_answer_weights
 */
export const insertAnswersDirectly = async (
  concursoId: string, 
  answerKeyData: AnswerKeyItem[]
): Promise<SaveAnswerKeyResult> => {
  try {
    logger.info(`Tentando inserir diretamente no banco de dados para concurso: ${concursoId}`);
    
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
    
    // Primeiro, remover registros existentes para este concurso para evitar conflitos
    const { error: deleteError } = await supabase
      .from('official_answer_weights')
      .delete()
      .eq('concurso_id', concursoId);
    
    if (deleteError) {
      logger.error('Erro ao limpar gabarito existente:', deleteError);
      throw deleteError;
    }
    
    // Preparar dados para inserção e garantir que section_type seja válido
    const insertData = answerKeyData.map(item => {
      // Determinar o tipo de seção correto baseado na estrutura do concurso
      // Usar APENAS tipos válidos conhecidos pelo banco de dados
      const correctedSectionType = getSectionTypeForQuestion(concurso, item.question_number);
      
      return {
        concurso_id: item.concurso_id,
        question_number: item.question_number,
        correct_answer: item.correct_answer,
        weight: item.weight || 1.0,
        is_nullified: item.is_nullified || false,
        section_type: correctedSectionType
      };
    });
    
    // Registrar os section_types para debug
    insertData.forEach(item => {
      logger.debug(`Questão ${item.question_number} com section_type: ${item.section_type}`);
    });
    
    // Inserir todos os registros de uma vez
    const { data, error } = await supabase
      .from('official_answer_weights')
      .insert(insertData)
      .select();
    
    if (error) {
      logger.error('Erro ao inserir gabarito diretamente:', error);
      throw error;
    }
    
    logger.info(`Inserção direta: ${data?.length || 0} questões inseridas com sucesso`);
    
    return {
      success: true,
      insertedCount: data?.length || 0
    };
  } catch (error) {
    logger.error('Erro na inserção direta:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
};
