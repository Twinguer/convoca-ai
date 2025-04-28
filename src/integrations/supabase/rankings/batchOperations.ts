
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';

// Improved function to recalculate scores for all users in a concurso
export const recalculateAllUserScores = async (concursoId: string) => {
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
      return { success: true, updatedCount: 0, message: "Nenhum ranking encontrado" };
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
    
    // Log início do processamento em lote
    await supabase.from('score_calculation_logs').insert({
      calculation_type: 'batch_recalculate_start',
      calculation_details: {
        concurso_id: concursoId,
        total_rankings: userRankings.length,
        timestamp: new Date().toISOString()
      }
    });
    
    // Processa rankings em lotes para evitar sobrecarga
    const batchSize = 50;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Processa em lotes menores para melhor performance
    for (let i = 0; i < userRankings.length; i += batchSize) {
      const batch = userRankings.slice(i, i + batchSize);
      
      // Processa cada ranking no lote
      const batchPromises = batch.map(async (ranking) => {
        try {
          // Busca as respostas do usuário
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_ranking_id', ranking.id);
            
          if (answersError) {
            console.error(`Erro ao buscar respostas para o ranking ${ranking.id}:`, answersError);
            errorCount++;
            return;
          }
          
          if (!userAnswers || userAnswers.length === 0) {
            console.log(`Nenhuma resposta encontrada para o ranking ${ranking.id}`);
            return;
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
            
          if (rankingError) {
            console.error(`Erro ao buscar pontuações subjetivas para o ranking ${ranking.id}:`, rankingError);
            errorCount++;
            return;
          }
          
          // Prepara as pontuações subjetivas
          const subjectiveScores = {
            discursiveScore: rankingData?.discursive_score || 0,
            caseStudy1Score: rankingData?.case_study_1_score || 0,
            caseStudy2Score: rankingData?.case_study_2_score || 0,
            caseStudy3Score: rankingData?.case_study_3_score || 0
          };
          
          // Aplica os pesos
          const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
          
          // Salva todas as pontuações
          try {
            await saveUserScores(ranking.id, rawScores, subjectiveScores, weightedScores);
            updatedCount++;
            
            // Registra as novas pontuações no log
            await supabase.from('score_calculation_logs').insert({
              user_ranking_id: ranking.id,
              calculation_type: 'recalculate_all_scores',
              new_score: weightedScores.totalScore,
              calculation_details: {
                reason: 'Recálculo após atualização do gabarito oficial',
                basic_score: rawScores.basicKnowledgeScore,
                specific_score: rawScores.specificKnowledgeScore,
                total_score: weightedScores.totalScore
              }
            });
          } catch (error) {
            console.error(`Erro ao atualizar pontuações para o ranking ${ranking.id}:`, error);
            errorCount++;
          }
        } catch (innerError) {
          console.error(`Erro ao processar ranking ${ranking.id}:`, innerError);
          errorCount++;
        }
      });
      
      // Aguarda processamento do lote atual antes de seguir para o próximo
      await Promise.all(batchPromises);
      
      // Log de progresso a cada lote
      console.log(`Processado lote ${i/batchSize + 1} de ${Math.ceil(userRankings.length/batchSize)}`);
    }
    
    // Log de conclusão do recálculo
    await supabase.from('score_calculation_logs').insert({
      calculation_type: 'batch_recalculate_complete',
      calculation_details: {
        concurso_id: concursoId,
        updated_count: updatedCount,
        error_count: errorCount,
        timestamp: new Date().toISOString()
      }
    });
    
    return { 
      success: true, 
      updatedCount, 
      errorCount,
      message: `Recálculo concluído. Atualizados: ${updatedCount}, Erros: ${errorCount}` 
    };
  } catch (error: any) {
    console.error('Erro recalculando todas as pontuações de usuários:', error);
    
    // Log do erro
    await supabase.from('score_calculation_logs').insert({
      calculation_type: 'batch_recalculate_error',
      calculation_details: {
        concurso_id: concursoId,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
    
    return { 
      success: false, 
      error: error.message,
      message: `Erro ao recalcular: ${error.message}` 
    };
  }
};
