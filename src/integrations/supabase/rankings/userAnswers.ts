
import { supabase } from '../client';
import { saveUserAnswersData } from './answerManagement';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';
import { recalculateAllUserScores } from './batchOperations';

// Definição de tipos para o retorno da função
interface SuccessResult {
  success: true;
  totalScore: number;
  basicKnowledgeScore: number;
  specificKnowledgeScore: number;
  specific1Score: number;
  specific2Score: number;
  specific3Score: number;
  [key: string]: any;
}

interface ErrorResult {
  success: false;
  error: string;
}

type SaveUserAnswersResult = SuccessResult | ErrorResult;

// Função principal para salvar respostas do usuário e calcular pontuações
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; is_basic_knowledge?: boolean }[]
): Promise<SaveUserAnswersResult> => {
  try {
    console.log('Iniciando processamento de pontuação para ranking:', rankingId);
    
    // 1. Primeiro buscamos as respostas do banco, não usando as passadas por parâmetro
    // Isso garante que estamos sempre trabalhando com os dados mais recentes
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) {
      console.error('Erro ao buscar respostas do usuário:', answersError);
      throw answersError;
    }
    
    if (!userAnswers || userAnswers.length === 0) {
      throw new Error('Nenhuma resposta encontrada para processamento. Verifique se as respostas foram salvas corretamente.');
    }

    console.log(`Processando ${userAnswers.length} respostas para cálculo de pontuação`);
    
    // 2. Calcular as pontuações brutas (baseado nas respostas do banco)
    const rawScores = await calculateRawScores(concursoId, userAnswers);
    console.log('Pontuações brutas calculadas:', rawScores);
    
    // 3. Buscar as pontuações subjetivas diretamente do banco
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score
      `)
      .eq('id', rankingId)
      .single();
      
    if (rankingError) {
      console.error('Erro ao buscar pontuações subjetivas:', rankingError);
      throw rankingError;
    }
    
    // Montar objeto com pontuações subjetivas
    const subjectiveScores = {
      discursiveScore: rankingData?.discursive_score || 0,
      caseStudy1Score: rankingData?.case_study_1_score || 0,
      caseStudy2Score: rankingData?.case_study_2_score || 0,
      caseStudy3Score: rankingData?.case_study_3_score || 0
    };
    
    console.log('Pontuações subjetivas recuperadas:', subjectiveScores);
    
    // 4. Aplicar os pesos para calcular as pontuações ponderadas
    const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
    console.log('Pontuações ponderadas calculadas:', weightedScores);
    
    // 5. Salvar todas as pontuações no banco de dados
    await saveUserScores(rankingId, rawScores, subjectiveScores, weightedScores);
    
    // 6. Marcar que o recálculo foi concluído
    await supabase
      .from('user_rankings')
      .update({ 
        is_score_recalculated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
    
    console.log('Processamento de pontuação concluído com sucesso');

    // Retornar as pontuações calculadas
    return {
      success: true,
      ...rawScores,
      ...subjectiveScores,
      ...weightedScores,
      totalScore: weightedScores.totalScore
    };
  } catch (error: any) {
    console.error('Erro completo no processamento de pontuação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido durante o cálculo de pontuação'
    };
  }
};

// Re-exporta a função de recálculo em lote
export { recalculateAllUserScores };
