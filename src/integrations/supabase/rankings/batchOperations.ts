
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
    
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('Nenhum ranking de usuário encontrado para este concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`Encontrados ${userRankings.length} rankings para atualizar`);
    
    let updatedCount = 0;
    const failedRankings: Array<{ rankingId: string; userId: string; error: string; attempts: number }> = [];
    
    for (const ranking of userRankings) {
      const maxRetries = 3;
      let currentTry = 0;
      let success = false;
      
      while (currentTry < maxRetries && !success) {
        try {
          // Log mais detalhado sobre o ranking atual
          console.log(`Processando ranking ${ranking.id} para usuário ${ranking.user_id} (tentativa ${currentTry + 1})`);
          
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_ranking_id', ranking.id);
            
          if (answersError) throw answersError;
          
          console.log(`Encontradas ${userAnswers?.length || 0} respostas para o ranking ${ranking.id}`);
          
          // Prepara as pontuações subjetivas
          const subjectiveScores = {
            discursiveScore: ranking.discursive_score || 0,
            caseStudy1Score: ranking.case_study_1_score || 0,
            caseStudy2Score: ranking.case_study_2_score || 0,
            caseStudy3Score: ranking.case_study_3_score || 0
          };
          
          console.log(`Pontuações subjetivas para o ranking ${ranking.id}:`, subjectiveScores);
          
          // Calcular pontuações brutas
          const rawScores = await calculateRawScores(concursoId, userAnswers || []);
          console.log(`Pontuações brutas calculadas para o ranking ${ranking.id}:`, rawScores);
          
          // Aplicar pesos às pontuações
          const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
          console.log(`Pontuações ponderadas calculadas para o ranking ${ranking.id}:`, weightedScores);
          
          // Garantir que o formato dos dados seja exatamente o que a função RPC espera
          const formattedRawScores = {
            basicKnowledgeScore: rawScores.basicKnowledgeScore || 0,
            specificKnowledgeScore: rawScores.specificKnowledgeScore || 0,
            specific1Score: rawScores.specific1Score || 0,
            specific2Score: rawScores.specific2Score || 0,
            specific3Score: rawScores.specific3Score || 0
          };
          
          const formattedWeightedScores = {
            weightedBasicScore: weightedScores.weightedBasicScore || 0,
            weightedSpecific1Score: weightedScores.weightedSpecific1Score || 0,
            weightedSpecific2Score: weightedScores.weightedSpecific2Score || 0,
            weightedSpecific3Score: weightedScores.weightedSpecific3Score || 0,
            weightedDiscursiveScore: weightedScores.weightedDiscursiveScore || 0,
            weightedCaseStudy1Score: weightedScores.weightedCaseStudy1Score || 0,
            weightedCaseStudy2Score: weightedScores.weightedCaseStudy2Score || 0,
            weightedCaseStudy3Score: weightedScores.weightedCaseStudy3Score || 0,
            totalScore: weightedScores.totalScore || 0
          };
          
          // Usa a função RPC para salvar as pontuações em uma única transação
          console.log(`Salvando pontuações para o ranking ${ranking.id} via RPC...`);
          const { data: rpcResult, error: rpcError } = await supabase.rpc('save_scores_transaction', {
            p_ranking_id: ranking.id,
            p_raw_scores: formattedRawScores,
            p_weighted_scores: formattedWeightedScores,
            p_subjective_scores: subjectiveScores
          });
          
          if (rpcError) {
            console.error(`Erro na função RPC para o ranking ${ranking.id}:`, rpcError);
            throw rpcError;
          }
          
          console.log(`Resposta da RPC para o ranking ${ranking.id}:`, rpcResult);
          
          if (!rpcResult || !rpcResult.success) {
            const errorMsg = (rpcResult && rpcResult.error) ? rpcResult.error : 'Erro desconhecido ao salvar pontuações';
            console.error(`Erro ao salvar pontuações para o ranking ${ranking.id}:`, errorMsg);
            throw new Error(errorMsg);
          }
          
          updatedCount++;
          success = true;
          
          console.log(`Ranking ${ranking.id} atualizado com sucesso. Nova pontuação total: ${formattedWeightedScores.totalScore}`);
          
        } catch (error: any) {
          currentTry++;
          const waitTime = Math.pow(2, currentTry) * 1000; // Backoff exponencial
          console.error(`Tentativa ${currentTry} falhou para ranking ${ranking.id}:`, error);
          
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
