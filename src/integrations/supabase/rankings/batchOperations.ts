
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';

// Recalcula as pontuações para todos os usuários em um concurso
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
    
    // Processa cada ranking de usuário
    let updatedCount = 0;
    for (const ranking of userRankings) {
      try {
        // Busca as respostas do usuário
        const { data: userAnswers, error: answersError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('user_ranking_id', ranking.id);
          
        if (answersError) {
          console.error(`Erro ao buscar respostas para o ranking ${ranking.id}:`, answersError);
          continue;
        }
        
        if (!userAnswers || userAnswers.length === 0) {
          console.log(`Nenhuma resposta encontrada para o ranking ${ranking.id}`);
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
          
        if (rankingError) {
          console.error(`Erro ao buscar pontuações subjetivas para o ranking ${ranking.id}:`, rankingError);
          continue;
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
              reason: 'Recálculo após anulação de questões',
              basic_score: rawScores.basicKnowledgeScore,
              specific_score: rawScores.specificKnowledgeScore,
              total_score: weightedScores.totalScore
            }
          });
          
          console.log(`Ranking ${ranking.id} atualizado com sucesso. Nova pontuação: ${weightedScores.totalScore}`);
        } catch (error) {
          console.error(`Erro ao atualizar pontuações para o ranking ${ranking.id}:`, error);
          continue;
        }
      } catch (innerError) {
        console.error(`Erro ao processar ranking ${ranking.id}:`, innerError);
        continue;
      }
    }
    
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Erro recalculando todas as pontuações de usuários:', error);
    return { success: false, error: error.message };
  }
};
