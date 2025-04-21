
import { supabase } from '../client';
import { saveUserAnswersData } from './answerManagement';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';
import { recalculateAllUserScores } from './batchOperations';

// Função principal para salvar respostas do usuário e calcular pontuações.
// AGORA aceita os valores subjetivos DIRETAMENTE.
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[],
  discursiveScore?: number,
  caseStudy1Score?: number,
  caseStudy2Score?: number,
  caseStudy3Score?: number
) => {
  try {
    console.log('Iniciando salvamento de respostas do usuário e cálculo de pontuação');
    console.log('Inputs:', { rankingId, concursoId, answersCount: answers.length, discursiveScore, caseStudy1Score, caseStudy2Score, caseStudy3Score });
    
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

    console.log(`Recalculando pontuações para ${userAnswers.length} respostas`);

    // 3. Calcular as pontuações brutas (quantidade de acertos sem pesos)
    const rawScores = await calculateRawScores(concursoId, userAnswers);
    console.log('Pontuações brutas calculadas:', rawScores);
    
    // 4. Pega os valores subjetivos PUROS vindos do formulário e não do banco!
    // Usamos 0 como fallback caso o valor venha undefined, para compatibilidade.
    const subjectiveScores = {
      discursiveScore: discursiveScore ?? 0,
      caseStudy1Score: caseStudy1Score ?? 0,
      caseStudy2Score: caseStudy2Score ?? 0,
      caseStudy3Score: caseStudy3Score ?? 0
    };
    
    console.log('Pontuações subjetivas brutas (direto do formulário):', subjectiveScores);
    
    // 5. Aplicar os pesos para calcular as pontuações ponderadas (somente nesta etapa)
    const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
    console.log('Pontuações ponderadas calculadas:', weightedScores);
    
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

