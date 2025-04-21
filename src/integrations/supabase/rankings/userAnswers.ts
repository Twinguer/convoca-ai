
import { supabase } from '../client';

// Esta função será substituída pela stored procedure, mantemos apenas para compatibilidade
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge?: boolean }[]
) => {
  try {
    console.log('[saveUserAnswers] Usando função RPC centralizada...');
    
    // Preparar os dados para enviar à função RPC
    const answersForRPC = answers.map(a => ({
      questionNumber: a.questionNumber,
      answer: a.answer
    }));
    
    // A chamada real será feita pelo hook useSaveAnswers
    // Esta função existe apenas para manter compatibilidade com código existente
    
    console.log('[saveUserAnswers] Total de respostas a serem processadas:', answersForRPC.length);
    return true;
  } catch (error: any) {
    console.error('[saveUserAnswers] Erro (compatibilidade):', error);
    throw error;
  }
};

// Função para buscar as respostas de um usuário
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[fetchUserAnswers] Erro ao buscar respostas:', error);
    return [];
  }
};

// Re-exporta a função de recálculo em lote para manter compatibilidade
export { recalculateAllUserScores } from './batchOperations';
