
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
    
    console.log(`Encontrados ${userRankings.length} rankings para atualizar`);
    
    // Arrays para armazenar resultados
    let updatedCount = 0;
    const failedRankings: Array<{ rankingId: string; userId: string; error: string; attempts: number }> = [];
    
    // Processa cada ranking com retentativas
    for (const ranking of userRankings) {
      const maxRetries = 3;
      let currentTry = 0;
      let success = false;
      
      while (currentTry < maxRetries && !success) {
        try {
          // Busca todas as respostas do usuário
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_ranking_id', ranking.id);
            
          if (answersError) throw answersError;
          
          // Se não há respostas, registra e continua
          if (!userAnswers || userAnswers.length === 0) {
            console.log(`Nenhuma resposta encontrada para ranking ${ranking.id}`);
            success = true;
            continue;
          }
          
          // Busca pontuações subjetivas atuais
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
          
          // Calcula pontuações brutas
          const rawScores = await calculateRawScores(concursoId, userAnswers);
          
          // Aplica pesos
          const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
          
          // Tenta salvar as pontuações usando uma transação RPC
          const { data: rpcResult, error: rpcError } = await supabase.rpc('save_scores_transaction', {
            p_ranking_id: ranking.id,
            p_raw_scores: rawScores,
            p_weighted_scores: weightedScores,
            p_subjective_scores: subjectiveScores
          });
          
          if (rpcError) throw rpcError;
          
          updatedCount++;
          success = true;
          
          console.log(`Ranking ${ranking.id} atualizado com sucesso. Nova pontuação: ${weightedScores.totalScore}`);
          
        } catch (error: any) {
          currentTry++;
          const waitTime = Math.pow(2, currentTry) * 1000; // Backoff exponencial
          console.error(`Tentativa ${currentTry} falhou para ranking ${ranking.id}:`, error);
          
          // Se ainda há tentativas, aguarda antes da próxima
          if (currentTry < maxRetries) {
            console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            // Registra falha após todas as tentativas
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
