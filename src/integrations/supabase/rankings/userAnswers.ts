
import { supabase } from '../client';
import { saveUserAnswersData } from './answerManagement';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';
import { recalculateAllUserScores, recalculateUserScore } from './batchOperations';

/**
 * Salva as respostas do usuário e calcula pontuações
 */
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    console.log('Iniciando salvamento de respostas e cálculo de pontuação');
    
    // 1. Salva as respostas do usuário
    await saveUserAnswersData(rankingId, concursoId, answers);
    
    // 2. Recalcula a pontuação do usuário
    const result = await recalculateUserScore(rankingId, concursoId);
    
    if (!result.success) {
      throw new Error(result.error || 'Falha ao recalcular pontuação');
    }
    
    // Busca o ranking atualizado para retornar
    const { data: ranking, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
      
    if (rankingError) throw rankingError;
    
    console.log('Salvamento e cálculo concluídos com sucesso');
    return {
      success: true,
      ranking
    };
  } catch (error: any) {
    console.error('Erro salvando respostas e calculando pontuação:', error);
    throw error;
  }
};

// Incrementa o contador de edições
export const incrementEditCounter = async (rankingId: string) => {
  try {
    const { error } = await supabase.rpc('increment_edit_counter', {
      ranking_id: rankingId
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao incrementar contador de edições:', error);
    return false;
  }
};

// Re-exporta as funções de recálculo em lote
export { recalculateAllUserScores, recalculateUserScore };
