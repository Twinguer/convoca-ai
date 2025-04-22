
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores } from './scoreCalculation';

// Tipagem melhorada para resultados e erros
interface FailedRanking {
  rankingId: string;
  userId: string;
  error: string;
  attempts: number;
}

interface RecalculationResult {
  success: boolean;
  updatedCount: number;
  failedRankings?: FailedRanking[];
  error?: string;
}

interface UserRanking {
  id: string;
  user_id: string;
  discursive_score: number | null;
  case_study_1_score: number | null;
  case_study_2_score: number | null;
  case_study_3_score: number | null;
}

interface ProcessRankingResult {
  success: boolean;
  error?: string;
}

// Processa um ranking individual - extraído para melhor modularidade
async function processRanking(
  ranking: UserRanking, 
  concursoId: string, 
  batchSize: number,
  attempt: number
): Promise<ProcessRankingResult> {
  try {
    // Log de início do processamento com informações detalhadas
    console.log(`[processRanking] Iniciando processamento do ranking ${ranking.id} (usuário ${ranking.user_id}) - Tentativa ${attempt + 1} - Batch ${batchSize}`);
    
    // Buscar respostas do usuário
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', ranking.id);
      
    if (answersError) {
      console.error(`[processRanking] Erro ao buscar respostas para ranking ${ranking.id}:`, answersError);
      throw answersError;
    }
    
    // Log das respostas encontradas
    console.log(`[processRanking] Encontradas ${userAnswers?.length || 0} respostas para o ranking ${ranking.id}`);
    
    // Prepara as pontuações subjetivas
    const subjectiveScores = {
      discursiveScore: ranking.discursive_score || 0,
      caseStudy1Score: ranking.case_study_1_score || 0,
      caseStudy2Score: ranking.case_study_2_score || 0,
      caseStudy3Score: ranking.case_study_3_score || 0
    };
    
    // Log das pontuações subjetivas
    console.log(`[processRanking] Pontuações subjetivas para o ranking ${ranking.id}:`, subjectiveScores);
    
    // Calcular pontuações brutas
    console.log(`[processRanking] Calculando pontuações brutas para ranking ${ranking.id}...`);
    const rawScores = await calculateRawScores(concursoId, userAnswers || []);
    console.log(`[processRanking] Pontuações brutas calculadas para o ranking ${ranking.id}:`, rawScores);
    
    // Aplicar pesos às pontuações
    console.log(`[processRanking] Aplicando pesos às pontuações para ranking ${ranking.id}...`);
    const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
    console.log(`[processRanking] Pontuações ponderadas calculadas para o ranking ${ranking.id}:`, weightedScores);
    
    // Formatar os dados para a função RPC
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
    
    // Salvar as pontuações via RPC
    console.log(`[processRanking] Salvando pontuações para o ranking ${ranking.id} via RPC (total: ${formattedWeightedScores.totalScore})...`);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('save_scores_transaction', {
      p_ranking_id: ranking.id,
      p_raw_scores: formattedRawScores,
      p_weighted_scores: formattedWeightedScores,
      p_subjective_scores: subjectiveScores
    });
    
    // Verificar e logar resultado da RPC
    if (rpcError) {
      console.error(`[processRanking] Erro na função RPC para o ranking ${ranking.id}:`, rpcError);
      throw rpcError;
    }
    
    console.log(`[processRanking] Resposta da RPC para o ranking ${ranking.id}:`, rpcResult);
    
    if (!rpcResult || !rpcResult.success) {
      const errorMsg = (rpcResult && rpcResult.error) ? rpcResult.error : 'Erro desconhecido ao salvar pontuações';
      console.error(`[processRanking] Erro ao salvar pontuações para o ranking ${ranking.id}:`, errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[processRanking] Ranking ${ranking.id} atualizado com sucesso. Nova pontuação total: ${formattedWeightedScores.totalScore}`);
    return { success: true };
    
  } catch (error: any) {
    console.error(`[processRanking] Falha ao processar ranking ${ranking.id}:`, error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido no processamento' 
    };
  }
}

// Função principal de recálculo com processamento em lotes
export const recalculateAllUserScores = async (concursoId: string): Promise<RecalculationResult> => {
  try {
    console.log(`[recalculateAllUserScores] Iniciando recálculo de scores para concurso: ${concursoId}`);
    
    // Obter todos os rankings do concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) {
      console.error('[recalculateAllUserScores] Erro ao buscar rankings:', rankingsError);
      throw rankingsError;
    }
    
    if (!userRankings || userRankings.length === 0) {
      console.log('[recalculateAllUserScores] Nenhum ranking de usuário encontrado para este concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`[recalculateAllUserScores] Encontrados ${userRankings.length} rankings para atualizar`);
    
    let updatedCount = 0;
    const failedRankings: FailedRanking[] = [];
    const maxRetries = 3;
    const batchSize = 5; // Tamanho do lote para processamento
    
    // Processar rankings em lotes para melhor performance
    for (let i = 0; i < userRankings.length; i += batchSize) {
      const currentBatch = userRankings.slice(i, i + batchSize);
      console.log(`[recalculateAllUserScores] Processando lote ${Math.floor(i/batchSize) + 1}, com ${currentBatch.length} rankings`);
      
      // Processa os rankings do lote atual em paralelo
      const batchResults = await Promise.all(
        currentBatch.map(async (ranking) => {
          let currentTry = 0;
          let success = false;
          let resultError = '';
          
          // Tenta processar cada ranking até o número máximo de tentativas
          while (currentTry < maxRetries && !success) {
            const result = await processRanking(ranking, concursoId, batchSize, currentTry);
            
            if (result.success) {
              success = true;
            } else {
              currentTry++;
              resultError = result.error || 'Erro desconhecido';
              
              if (currentTry < maxRetries) {
                const waitTime = Math.pow(2, currentTry) * 1000; // Backoff exponencial
                console.log(`[recalculateAllUserScores] Aguardando ${waitTime}ms antes da próxima tentativa para ranking ${ranking.id}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          }
          
          // Retorna o resultado do processamento deste ranking
          return {
            ranking,
            success,
            attempts: currentTry,
            error: success ? undefined : resultError
          };
        })
      );
      
      // Atualiza contadores com base nos resultados do lote
      batchResults.forEach(result => {
        if (result.success) {
          updatedCount++;
        } else {
          failedRankings.push({
            rankingId: result.ranking.id,
            userId: result.ranking.user_id,
            error: result.error || 'Erro desconhecido',
            attempts: result.attempts
          });
        }
      });
      
      console.log(`[recalculateAllUserScores] Lote ${Math.floor(i/batchSize) + 1} processado. ` +
        `Sucesso: ${batchResults.filter(r => r.success).length}, ` +
        `Falhas: ${batchResults.filter(r => !r.success).length}`);
    }
    
    // Registra o resultado final do recálculo no log
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
    
    // Salva log no banco de dados
    await supabase.from('score_calculation_logs').insert([logDetails]);
    console.log(`[recalculateAllUserScores] Finalizado. Atualizados com sucesso: ${updatedCount}/${userRankings.length}`);
    
    return {
      success: true,
      updatedCount,
      failedRankings: failedRankings.length > 0 ? failedRankings : undefined
    };
    
  } catch (error: any) {
    console.error('[recalculateAllUserScores] Erro fatal recalculando pontuações:', error);
    return {
      success: false,
      updatedCount: 0,
      error: error.message
    };
  }
};
