
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';

/**
 * Recalcula as pontuações de todos os usuários de um concurso específico
 * Útil quando o gabarito oficial é atualizado
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`Iniciando recálculo em lote para concurso ${concursoId}`);
    
    // 1. Obter todos os usuários que participam deste concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      return { success: true, updatedCount: 0, message: 'Nenhum usuário encontrado para este concurso' };
    }
    
    // 2. Para cada usuário, buscar suas respostas e recalcular a pontuação
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const ranking of userRankings) {
      try {
        // 2.1 Buscar as respostas do usuário
        const { data: userAnswers, error: answersError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('user_ranking_id', ranking.id);
          
        if (answersError) throw answersError;
        
        // Pular usuários sem respostas
        if (!userAnswers || userAnswers.length === 0) continue;
        
        // 2.2 Buscar dados do ranking para as pontuações subjetivas
        const { data: rankingData, error: rankingError } = await supabase
          .from('user_rankings')
          .select(`
            discursive_score,
            case_study_1_score,
            case_study_2_score,
            case_study_3_score,
            score
          `)
          .eq('id', ranking.id)
          .single();
          
        if (rankingError) throw rankingError;
        
        const previousScore = rankingData.score || 0;
        
        // 2.3 Recalcular pontuações
        const rawScores = await calculateRawScores(concursoId, userAnswers);
        
        const subjectiveScores = {
          discursiveScore: rankingData?.discursive_score || 0,
          caseStudy1Score: rankingData?.case_study_1_score || 0,
          caseStudy2Score: rankingData?.case_study_2_score || 0,
          caseStudy3Score: rankingData?.case_study_3_score || 0
        };
        
        const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
        
        // 2.4 Salvar novas pontuações
        await saveUserScores(ranking.id, rawScores, subjectiveScores, weightedScores);
        
        // 2.5 Registrar o log de recálculo
        await supabase
          .from('score_calculation_logs')
          .insert({
            user_ranking_id: ranking.id,
            calculation_type: 'recalculation',
            previous_score: previousScore,
            new_score: weightedScores.totalScore,
            calculation_details: {
              raw_scores: rawScores,
              weighted_scores: weightedScores,
              reason: 'gabarito_atualizado'
            }
          });
        
        // 2.6 Marcar que o recálculo foi feito
        await supabase
          .from('user_rankings')
          .update({ 
            is_score_recalculated: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', ranking.id);
        
        updatedCount++;
      } catch (error) {
        console.error(`Erro ao recalcular pontuação para ranking ${ranking.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Recálculo concluído: ${updatedCount} usuários atualizados, ${errorCount} falhas`);
    
    return { 
      success: true, 
      updatedCount, 
      errorCount,
      message: `Recálculo concluído com sucesso para ${updatedCount} usuários`
    };
  } catch (error) {
    console.error('Erro durante o recálculo em lote:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido durante o recálculo' 
    };
  }
};
