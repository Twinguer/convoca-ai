
import { supabase } from '../client';
import { saveUserAnswersData } from './answerManagement';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';
import { recalculateAllUserScores } from './batchOperations';

// Função principal para salvar respostas do usuário e calcular pontuações
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    console.log('Iniciando salvamento de respostas do usuário e cálculo de pontuação');
    
    // 1. Salvar as respostas brutas (sem aplicar pesos)
    await saveUserAnswersData(rankingId, concursoId, answers);
    
    // 2. Buscar as respostas salvas do usuário para recalcular as pontuações brutas
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) throw answersError;
    
    if (!userAnswers || userAnswers.length === 0) {
      throw new Error('Nenhuma resposta encontrada após o salvamento');
    }

    // 3. Calcular as pontuações brutas (quantidade de acertos sem pesos)
    const rawScores = await calculateRawScores(concursoId, userAnswers);
    
    // 4. Buscar as pontuações subjetivas brutas
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
      
    if (rankingError) throw rankingError;
    
    // Preparar as pontuações subjetivas brutas
    const subjectiveScores = {
      discursiveScore: rankingData?.discursive_score || 0,
      caseStudy1Score: rankingData?.case_study_1_score || 0,
      caseStudy2Score: rankingData?.case_study_2_score || 0,
      caseStudy3Score: rankingData?.case_study_3_score || 0
    };
    
    // 5. Aplicar os pesos para calcular as pontuações ponderadas (somente nesta etapa)
    const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
    
    // 6. Salvar todas as pontuações (brutas e ponderadas)
    await saveUserScores(rankingId, rawScores, subjectiveScores, weightedScores);

    // 7. Retornar as pontuações calculadas
    return {
      success: true,
      rawScores: {
        ...rawScores,
        ...subjectiveScores
      },
      weightedScores
    };
  } catch (error: any) {
    console.error('Erro salvando respostas e calculando pontuação:', error);
    throw error;
  }
};

// Re-exporta a função de recálculo em lote
export { recalculateAllUserScores };
