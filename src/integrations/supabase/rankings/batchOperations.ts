
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';

interface RecalculationResult {
  success: boolean;
  updatedCount: number;
  failedRankings?: Array<{
    rankingId: string;
    userId: string;
    error: string;
  }>;
  error?: string;
}

// Recalcula as pontuações para todos os usuários em um concurso
export const recalculateAllUserScores = async (concursoId: string): Promise<RecalculationResult> => {
  try {
    console.log(`Recalculando scores para todos os usuários no concurso: ${concursoId}`);
    
    // Busca todos os rankings de usuários para este concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('Nenhum ranking de usuário encontrado para este concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`Encontrados ${userRankings.length} rankings de usuários para atualizar`);
    
    // Verifica se há questões anuladas
    const { data: nullifiedQuestions, error: nullifiedError } = await supabase
      .from('answer_keys')
      .select('question_number')
      .eq('concurso_id', concursoId)
      .eq('is_nullified', true);
      
    if (nullifiedError) throw nullifiedError;
    
    if (nullifiedQuestions && nullifiedQuestions.length > 0) {
      console.log(`Encontradas ${nullifiedQuestions.length} questões anuladas`);
      const nullifiedNumbers = nullifiedQuestions.map(q => q.question_number).join(', ');
      console.log(`Questões anuladas: ${nullifiedNumbers}`);
    }
    
    // Arrays para armazenar resultados
    let updatedCount = 0;
    const failedRankings: Array<{ rankingId: string; userId: string; error: string }> = [];
    
    // Processa cada ranking de usuário com retentativas
    for (const ranking of userRankings) {
      const maxRetries = 3;
      let currentTry = 0;
      let success = false;
      
      while (currentTry < maxRetries && !success) {
        try {
          // Busca as respostas do usuário
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_ranking_id', ranking.id);
            
          if (answersError) throw answersError;
          
          if (!userAnswers || userAnswers.length === 0) {
            console.log(`Nenhuma resposta encontrada para o ranking ${ranking.id}`);
            success = true; // Consideramos sucesso pois não há o que recalcular
            continue;
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
            .eq('id', ranking.id)
            .single();
            
          if (rankingError) throw rankingError;
          
          // Prepara as pontuações subjetivas
          const subjectiveScores = {
            discursiveScore: rankingData?.discursive_score || 0,
            caseStudy1Score: rankingData?.case_study_1_score || 0,
            caseStudy2Score: rankingData?.case_study_2_score || 0,
            caseStudy3Score: rankingData?.case_study_3_score || 0
          };
          
          // Aplica os pesos
          const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
          
          // Salva todas as pontuações em uma única transação
          await supabase.rpc('save_scores_transaction', {
            p_ranking_id: ranking.id,
            p_raw_scores: rawScores,
            p_weighted_scores: weightedScores,
            p_subjective_scores: subjectiveScores
          });
          
          updatedCount++;
          success = true;
          
          console.log(`Ranking ${ranking.id} atualizado com sucesso. Nova pontuação: ${weightedScores.totalScore}`);
          
        } catch (error: any) {
          currentTry++;
          console.error(`Tentativa ${currentTry} falhou para ranking ${ranking.id}:`, error);
          
          // Se todas as tentativas falharam, registra o erro
          if (currentTry === maxRetries) {
            failedRankings.push({
              rankingId: ranking.id,
              userId: ranking.user_id,
              error: error.message || 'Erro desconhecido'
            });
          }
          
          // Aguarda um tempo antes da próxima tentativa (backoff exponencial)
          if (currentTry < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, currentTry) * 1000));
          }
        }
      }
    }
    
    // Registra o resultado final do recálculo
    await supabase.from('score_calculation_logs').insert({
      calculation_type: 'recalculate_all_scores',
      calculation_details: {
        concurso_id: concursoId,
        total_rankings: userRankings.length,
        successful_updates: updatedCount,
        failed_updates: failedRankings.length,
        failed_rankings: failedRankings
      }
    });
    
    return {
      success: true,
      updatedCount,
      failedRankings: failedRankings.length > 0 ? failedRankings : undefined
    };
    
  } catch (error: any) {
    console.error('Erro recalculando todas as pontuações de usuários:', error);
    return {
      success: false,
      updatedCount: 0,
      error: error.message
    };
  }
};

