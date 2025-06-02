
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

// Função para buscar as respostas de um usuário usando nova estrutura JSONB
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;
    
    // Process answers using new JSONB structure with fallback
    const processedAnswers = (data || []).map((item: any) => ({
      ...item,
      // Prioritize JSONB structure, fallback to old column
      answer: item.answers_data?.objective_answer || item.answer,
      section_type: item.section_type || (
        item.is_basic_knowledge ? 'basic' :
        item.is_specific_1 ? 'specific1' :
        item.is_specific_2 ? 'specific2' :
        item.is_specific_3 ? 'specific3' : 'basic'
      )
    }));
    
    return processedAnswers;
  } catch (error) {
    console.error('[fetchUserAnswers] Erro ao buscar respostas:', error);
    return [];
  }
};

// Re-exporta a função de recálculo em lote para manter compatibilidade
export { recalculateAllUserScores } from './batchOperations';
