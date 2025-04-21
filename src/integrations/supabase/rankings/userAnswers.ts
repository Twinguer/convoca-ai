
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
    
    // Salva as respostas do usuário
    await saveUserAnswersData(rankingId, concursoId, answers);
    
    // Busca as respostas salvas do usuário para recalcular as pontuações
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) throw answersError;
    
    if (!userAnswers || userAnswers.length === 0) {
      throw new Error('Nenhuma resposta encontrada após o salvamento');
    }

    // Calcula as pontuações brutas
    const rawScores = await calculateRawScores(concursoId, userAnswers);
    
    // Busca as pontuações subjetivas
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
    
    // Prepara as pontuações subjetivas
    const subjectiveScores = {
      discursiveScore: rankingData?.discursive_score || 0,
      caseStudy1Score: rankingData?.case_study_1_score || 0,
      caseStudy2Score: rankingData?.case_study_2_score || 0,
      caseStudy3Score: rankingData?.case_study_3_score || 0
    };
    
    // Aplica os pesos para calcular as pontuações ponderadas
    const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
    
    // Salva todas as pontuações
    await saveUserScores(rankingId, rawScores, subjectiveScores, weightedScores);

    // Retorna as pontuações calculadas
    return {
      success: true,
      ...rawScores,
      ...subjectiveScores,
      ...weightedScores
    };
  } catch (error: any) {
    console.error('Erro salvando respostas e calculando pontuação:', error);
    throw error;
  }
};

// Re-exporta a função de recálculo em lote
export { recalculateAllUserScores };
