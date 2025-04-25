
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores } from './scoreCalculation';

interface RecalculationResult {
  success: boolean;
  updatedCount: number;
  failedRankings?: Array<{
    rankingId: string;
    userId: string;
    error: string;
    attempts: number;
  }>;
  error?: string;
}

// Recalcula as pontuações para todos os usuários em um concurso
export const recalculateAllUserScores = async (concursoId: string): Promise<RecalculationResult> => {
  try {
    console.log(`Iniciando recálculo de scores para concurso: ${concursoId}`);
    
    // Buscar todos os rankings de usuários para este concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select(`
        id, 
        user_id,
        score,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        basic_knowledge_score,
        specific_knowledge_score,
        specific_knowledge_1_score,
        specific_knowledge_2_score,
        specific_knowledge_3_score,
        all_questions_answered
      `)
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('Nenhum ranking de usuário encontrado para este concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`Encontrados ${userRankings.length} rankings para atualizar`);
    
    // Verificar se o gabarito existe para este concurso
    const { data: answerKeyCount, error: answerKeyError } = await supabase
      .from('answer_keys')
      .select('*', { count: 'exact' })
      .eq('concurso_id', concursoId);
      
    if (answerKeyError) throw answerKeyError;
    
    const count = answerKeyCount ? answerKeyCount.length : 0;
    
    if (!count || count === 0) {
      console.log('Nenhum gabarito encontrado para este concurso, não é possível recalcular');
      return { 
        success: false, 
        updatedCount: 0, 
        error: 'Nenhum gabarito oficial encontrado para este concurso' 
      };
    }
    
    let updatedCount = 0;
    const failedRankings: Array<{ rankingId: string; userId: string; error: string; attempts: number }> = [];
    
    // Para cada ranking, buscar as respostas e recalcular conforme o gabarito atual
    for (const ranking of userRankings) {
      const maxRetries = 3;
      let currentTry = 0;
      let success = false;
      
      while (currentTry < maxRetries && !success) {
        try {
          // Buscar todas as respostas deste usuário
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_ranking_id', ranking.id);
            
          if (answersError) throw answersError;
          
          // Se o usuário não tem respostas, não podemos recalcular, mas registramos como sucesso
          // pois não é um erro, apenas não há o que recalcular
          if (!userAnswers || userAnswers.length === 0) {
            console.log(`[recalculateAllUserScores] Ranking ${ranking.id}, User ${ranking.user_id}: Nenhuma resposta encontrada, preservando pontuações existentes`);
            
            // Registrar esta ocorrência no log para depuração
            await supabase.from('score_calculation_logs').insert([{
              user_ranking_id: ranking.id,
              calculation_type: 'recalculate_skipped_no_answers',
              calculation_details: {
                concurso_id: concursoId,
                user_id: ranking.user_id,
                timestamp: new Date().toISOString()
              }
            }]);
            
            success = true;
            continue;
          }
          
          console.log(`[recalculateAllUserScores] Ranking ${ranking.id}, User ${ranking.user_id}: ${userAnswers.length} respostas encontradas`);
          
          // Preservar as pontuações subjetivas existentes
          const subjectiveScores = {
            discursiveScore: ranking?.discursive_score || 0,
            caseStudy1Score: ranking?.case_study_1_score || 0,
            caseStudy2Score: ranking?.case_study_2_score || 0,
            caseStudy3Score: ranking?.case_study_3_score || 0
          };
          
          // Calcular novas pontuações objetivas usando o gabarito oficial atual
          const rawScores = await calculateRawScores(concursoId, userAnswers || []);
          
          // Aplicar pesos às pontuações
          const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
          
          // Registrar detalhes do cálculo para debugging
          console.log(`[recalculateAllUserScores] Ranking ${ranking.id}, User ${ranking.user_id}:`);
          console.log('  Raw scores:', rawScores);
          console.log('  Subjective scores:', subjectiveScores);
          console.log('  Weighted scores:', weightedScores);
          
          // Usar a função RPC atualizada para salvar as pontuações em uma única transação
          // Incluir explicitamente TODAS as pontuações para garantir que nenhuma seja perdida
          const { data: rpcResult, error: rpcError } = await supabase.rpc('save_scores_transaction', {
            p_ranking_id: ranking.id,
            p_raw_scores: {
              basicKnowledgeScore: rawScores.basicKnowledgeScore,
              specificKnowledgeScore: rawScores.specificKnowledgeScore,
              specific1Score: rawScores.specific1Score,
              specific2Score: rawScores.specific2Score,
              specific3Score: rawScores.specific3Score
            },
            p_weighted_scores: {
              weightedBasicScore: weightedScores.weightedBasicScore,
              weightedSpecific1Score: weightedScores.weightedSpecific1Score,
              weightedSpecific2Score: weightedScores.weightedSpecific2Score,
              weightedSpecific3Score: weightedScores.weightedSpecific3Score,
              weightedDiscursiveScore: weightedScores.weightedDiscursiveScore,
              weightedCaseStudy1Score: weightedScores.weightedCaseStudy1Score,
              weightedCaseStudy2Score: weightedScores.weightedCaseStudy2Score,
              weightedCaseStudy3Score: weightedScores.weightedCaseStudy3Score,
              totalScore: weightedScores.totalScore
            },
            p_subjective_scores: subjectiveScores
          });
          
          if (rpcError) {
            console.error(`[recalculateAllUserScores] Erro na função RPC para ranking ${ranking.id}:`, rpcError);
            throw rpcError;
          }
          
          if (!rpcResult || !rpcResult.success) {
            const errorMsg = rpcResult?.error || 'Erro desconhecido ao salvar pontuações';
            console.error(`[recalculateAllUserScores] Falha na função RPC para ranking ${ranking.id}:`, errorMsg);
            throw new Error(errorMsg);
          }
          
          updatedCount++;
          success = true;
          
          console.log(`Ranking ${ranking.id} atualizado com sucesso. Nova pontuação: ${weightedScores.totalScore}`);
          
          // Registrar o recálculo bem-sucedido no log
          await supabase.from('score_calculation_logs').insert([{
            user_ranking_id: ranking.id,
            calculation_type: 'recalculate_success',
            previous_score: ranking.score ?? 0,
            new_score: weightedScores.totalScore,
            calculation_details: {
              concurso_id: concursoId,
              user_id: ranking.user_id,
              answers_count: userAnswers?.length || 0,
              timestamp: new Date().toISOString()
            }
          }]);
        } catch (error: any) {
          currentTry++;
          const waitTime = Math.pow(2, currentTry) * 1000; // Backoff exponencial
          console.error(`Tentativa ${currentTry} falhou para ranking ${ranking.id}:`, error);
          
          // Registrar o erro no log
          await supabase.from('score_calculation_logs').insert([{
            user_ranking_id: ranking.id,
            calculation_type: 'recalculate_attempt_error',
            calculation_details: {
              attempt: currentTry,
              error: error.message || 'Erro desconhecido',
              timestamp: new Date().toISOString()
            }
          }]);
          
          if (currentTry < maxRetries) {
            console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            failedRankings.push({
              rankingId: ranking.id,
              userId: ranking.user_id,
              error: error.message || 'Erro desconhecido',
              attempts: currentTry
            });
          }
        }
      }
    }
    
    // Registra o resultado final do recálculo
    const logDetails = {
      calculation_type: 'recalculate_all_scores',
      calculation_details: {
        concurso_id: concursoId,
        total_rankings: userRankings.length,
        successful_updates: updatedCount,
        failed_updates: failedRankings.length,
        failed_rankings: failedRankings,
        timestamp: new Date().toISOString()
      }
    };
    
    await supabase.from('score_calculation_logs').insert([logDetails]);
    
    return {
      success: true,
      updatedCount,
      failedRankings: failedRankings.length > 0 ? failedRankings : undefined
    };
    
  } catch (error: any) {
    console.error('Erro fatal recalculando pontuações:', error);
    return {
      success: false,
      updatedCount: 0,
      error: error.message
    };
  }
};
