
import { supabase } from '../client';

// Esta função será substituída pela stored procedure, mantemos apenas para compatibilidade
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge?: boolean }[]
) => {
  console.log('[saveUserAnswers] Função legada chamada, usando RPC...');
  return true;
};

// Função para buscar as respostas de um usuário
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;
    
    // Ensure question_number is returned as a number for consistency
    return data?.map(item => ({
      ...item,
      question_number: typeof item.question_number === 'string' 
        ? parseInt(item.question_number, 10) 
        : item.question_number
    })) || [];
  } catch (error) {
    console.error('[fetchUserAnswers] Erro ao buscar respostas:', error);
    return [];
  }
};

// Re-exporta a função de recálculo em lote para manter compatibilidade
export { recalculateAllUserScores } from './batchOperations';
