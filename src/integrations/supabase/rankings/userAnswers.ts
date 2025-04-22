
import { supabase } from '../client';

// Esta função será substituída pela stored procedure, mantemos apenas para compatibilidade
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge?: boolean }[]
) => {
  console.log('[saveUserAnswers] Função legada chamada, usando RPC...');
  console.log(`[saveUserAnswers] Ranking ID: ${rankingId}, Concurso ID: ${concursoId}, Total de respostas: ${answers.length}`);
  return true;
};

// Função para buscar as respostas de um usuário
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    console.log(`[fetchUserAnswers] Buscando respostas para o ranking ${rankingId}`);
    
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) {
      console.error('[fetchUserAnswers] Erro:', error);
      throw error;
    }
    
    console.log(`[fetchUserAnswers] Encontradas ${data?.length || 0} respostas`);
    return data || [];
  } catch (error) {
    console.error('[fetchUserAnswers] Erro ao buscar respostas:', error);
    return [];
  }
};

// Re-exporta a função de recálculo em lote para manter compatibilidade
export { recalculateAllUserScores } from './batchOperations';
