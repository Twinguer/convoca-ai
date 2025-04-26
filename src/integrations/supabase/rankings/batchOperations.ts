
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

export const recalculateAllUserScores = async (concursoId: string): Promise<RecalculationResult> => {
  try {
    console.log(`[recalculateAllUserScores] Iniciando recálculo de scores para concurso: ${concursoId}`);
    
    // Verificar se o gabarito existe para este concurso
    const { data: answerKeyCount, error: answerKeyError } = await supabase
      .from('answer_keys')
      .select('*', { count: 'exact' })
      .eq('concurso_id', concursoId);
      
    if (answerKeyError) throw answerKeyError;
    
    const count = answerKeyCount ? answerKeyCount.length : 0;
    
    if (!count || count === 0) {
      console.log('[recalculateAllUserScores] Nenhum gabarito encontrado para este concurso');
      return { 
        success: false, 
        updatedCount: 0, 
        error: 'Nenhum gabarito oficial encontrado para este concurso' 
      };
    }
    
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
        case_study_3_score
      `)
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('[recalculateAllUserScores] Nenhum ranking de usuário encontrado');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`[recalculateAllUserScores] Encontrados ${userRankings.length} rankings para atualizar`);
    
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
          
          // Calcular novas pontuações
          const rawScores = await calculateRawScores(concursoId, userAnswers || []);
          
          // Aplicar pesos
          const weightedScores = await applyWeightsToScores(
            concursoId,
            rawScores,
            {
              discursiveScore: ranking.discursive_score || 0,
              caseStudy1Score: ranking.case_study_1_score || 0,
              caseStudy2Score: ranking.case_study_2_score || 0,
              caseStudy3Score: ranking.case_study_3_score || 0
            }
          );
          
          // Registrar log de cálculo para debug
          await supabase.from('score_calculation_logs').insert([{
            user_ranking_id: ranking.id,
            calculation_type: 'recalculate_all_scores',
            previous_score: ranking.score,
            new_score: weightedScores.totalScore,
            calculation_details: {
              raw_scores: rawScores,
              weighted_scores: weightedScores,
              timestamp: new Date().toISOString()
            }
          }]);
          
          // Atualizar o ranking
          const { error: updateError } = await supabase
            .from('user_rankings')
            .update({
              ...rawScores,
              ...weightedScores,
              score: weightedScores.totalScore,
              updated_at: new Date().toISOString(),
              is_score_recalculated: true
            })
            .eq('id', ranking.id);
            
          if (updateError) throw updateError;
          
          updatedCount++;
          success = true;
          
          console.log(`[recalculateAllUserScores] Ranking ${ranking.id} atualizado com sucesso`);
          
        } catch (error: any) {
          currentTry++;
          const waitTime = Math.pow(2, currentTry) * 1000;
          console.error(`[recalculateAllUserScores] Tentativa ${currentTry} falhou para ranking ${ranking.id}:`, error);
          
          if (currentTry < maxRetries) {
            console.log(`[recalculateAllUserScores] Aguardando ${waitTime}ms antes da próxima tentativa...`);
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
