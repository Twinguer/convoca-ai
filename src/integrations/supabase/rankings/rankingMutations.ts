
import { supabase } from '@/integrations/supabase/client';

interface RecalculationResponse {
  success: boolean;
  message?: string;
  error?: any;
  updatedScore?: number;
}

type PositionThreshold = 'ampla' | 'cota_racial' | 'pcd';

const isPositionThreshold = (value: string): value is PositionThreshold => {
  return ['ampla', 'cota_racial', 'pcd'].includes(value);
};

export const recalculateUserScore = async (userId: string, concursoId: string): Promise<RecalculationResponse> => {
  try {
    console.log(`[recalculateUserScore] Recalculating score for user ${userId} in concurso ${concursoId}`);
    
    // Obter dados do concurso para aplicar regras específicas
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar dados do concurso:', concursoError);
      return { 
        success: false, 
        message: 'Erro ao obter dados do concurso', 
        error: concursoError 
      };
    }
    
    // Log da estrutura de disciplinas do concurso
    console.log(`[recalculateUserScore] Concurso discipline structure:`, 
               concurso.disciplines && concurso.disciplines.length > 0 ? 
               `${concurso.disciplines.length} disciplines/blocks` : 'No custom disciplines');

    // Se o concurso exige pontuação mínima verificamos isso
    let minimumScoreRequired = 0;
    
    // Verificar se tem score mínimo e buscar o valor corretamente
    if (concurso?.has_minimum_score === true) {
      // Usar acesso seguro à propriedade para evitar erro TypeScript
      minimumScoreRequired = typeof concurso?.total_minimum_score === 'number' 
        ? concurso.total_minimum_score 
        : parseInt(String(concurso?.total_minimum_score || '0'), 10);
        
      console.log(`[recalculateUserScore] Pontuação mínima requerida: ${minimumScoreRequired}`);
    }

    // Primeiro, busque o ranking_id correspondente ao usuário/concurso
    const { data: userRanking, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .single();

    if (userRankingError || !userRanking) {
      console.error('Erro ao buscar ranking do usuário:', userRankingError);
      return { 
        success: false, 
        message: 'Erro ao buscar ranking do usuário', 
        error: userRankingError 
      };
    }

    // Obter as respostas do usuário usando o ranking_id
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('question_number, answer')
      .eq('user_ranking_id', userRanking.id);

    if (userAnswersError) {
      console.error('Erro ao buscar respostas do usuário:', userAnswersError);
      return { 
        success: false, 
        message: 'Erro ao obter respostas do usuário', 
        error: userAnswersError 
      };
    }
    
    console.log(`[recalculateUserScore] Found ${userAnswers?.length || 0} answers for user`);

    // Obter os pesos das respostas corretas
    const { data: officialAnswers, error: officialAnswersError } = await supabase
      .from('official_answer_weights')
      .select('question_number, correct_answer, weight, is_nullified, section_type')
      .eq('concurso_id', concursoId);

    if (officialAnswersError) {
      console.error('Erro ao buscar pesos das respostas corretas:', officialAnswersError);
      return { 
        success: false, 
        message: 'Erro ao obter pesos das respostas corretas', 
        error: officialAnswersError 
      };
    }
    
    console.log(`[recalculateUserScore] Found ${officialAnswers?.length || 0} official answers`);

    let totalScore = 0;
    let totalWeight = 0;
    
    // Para armazenar pontuações por disciplina
    const disciplineScores: Record<string, number> = {};
    const weightedDisciplineScores: Record<string, number> = {};

    // Obter as pontuações subjetivas antes de calcular
    const { data: subjectiveScores, error: subjectiveScoresError } = await supabase
      .from('user_rankings')
      .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('id', userRanking.id)
      .single();
      
    if (subjectiveScoresError) {
      console.error('Erro ao buscar pontuações subjetivas:', subjectiveScoresError);
    }
    
    // Pontuações subjetivas e seus pesos
    const discursiveScore = subjectiveScores?.discursive_score || 0;
    const caseStudy1Score = subjectiveScores?.case_study_1_score || 0;
    const caseStudy2Score = subjectiveScores?.case_study_2_score || 0;
    const caseStudy3Score = subjectiveScores?.case_study_3_score || 0;
    
    const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
    const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
    const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
    const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);

    // Calcular a pontuação do usuário
    for (const userAnswer of userAnswers || []) {
      const officialAnswer = officialAnswers?.find(oa => oa.question_number === userAnswer.question_number);

      if (officialAnswer) {
        const isCorrect = officialAnswer.correct_answer === userAnswer.answer || officialAnswer.is_nullified === true;
        const questionWeight = officialAnswer.weight || 1;
        const sectionType = officialAnswer.section_type || 'default';
        
        // Inicializar pontuação da disciplina se ainda não existir
        if (!disciplineScores[sectionType]) {
            disciplineScores[sectionType] = 0;
            weightedDisciplineScores[sectionType] = 0;
        }
        
        if (isCorrect) {
          // Adicionar à pontuação total
          totalScore += questionWeight;
          
          // Adicionar à pontuação da disciplina específica
          disciplineScores[sectionType] += 1;
          weightedDisciplineScores[sectionType] += questionWeight;
          
          console.log(`[recalculateUserScore] Question ${userAnswer.question_number} correct (${sectionType}): +${questionWeight}`);
        }
        
        totalWeight += questionWeight;
      }
    }
    
    // Adicionar pontuações subjetivas ao total
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;
    
    console.log(`[recalculateUserScore] Calculated total score: ${totalScore}, discipline scores:`, disciplineScores);
    console.log(`[recalculateUserScore] Subjective scores: discursive=${weightedDiscursiveScore}, caseStudy1=${weightedCaseStudy1Score}, caseStudy2=${weightedCaseStudy2Score}, caseStudy3=${weightedCaseStudy3Score}`);

    // Atualizar a pontuação do usuário no ranking com as pontuações por disciplina
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({ 
        score: totalScore, 
        customDisciplineScores: disciplineScores,
        weightedCustomDisciplineScores: weightedDisciplineScores,
        // Manter as pontuações subjetivas
        discursive_score: discursiveScore,
        case_study_1_score: caseStudy1Score,
        case_study_2_score: caseStudy2Score,
        case_study_3_score: caseStudy3Score,
        // Manter as pontuações subjetivas ponderadas
        weighted_discursive_score: weightedDiscursiveScore,
        weighted_case_study_1_score: weightedCaseStudy1Score,
        weighted_case_study_2_score: weightedCaseStudy2Score,
        weighted_case_study_3_score: weightedCaseStudy3Score
      })
      .eq('id', userRanking.id);

    if (updateError) {
      console.error('Erro ao atualizar pontuação do usuário:', updateError);
      return { 
        success: false, 
        message: 'Erro ao atualizar pontuação do usuário', 
        error: updateError 
      };
    }
    
    // Verificar se o usuário atingiu a pontuação mínima
    if (minimumScoreRequired > 0 && totalScore < minimumScoreRequired) {
      // Atualizar o status do usuário para "eliminado"
      const { error: updateStatusError } = await supabase
        .from('user_rankings')
        .update({ status: 'eliminado' })
        .eq('id', userRanking.id);
        
      if (updateStatusError) {
        console.error('Erro ao atualizar status do usuário:', updateStatusError);
        return { 
          success: false, 
          message: 'Erro ao atualizar status do usuário', 
          error: updateStatusError 
        };
      }
    } else {
      // Se o usuário atingiu a pontuação mínima, atualizar o status para "classificado"
      const { error: updateStatusError } = await supabase
        .from('user_rankings')
        .update({ status: 'classificado' })
        .eq('id', userRanking.id);
        
      if (updateStatusError) {
        console.error('Erro ao atualizar status do usuário:', updateStatusError);
        return { 
          success: false, 
          message: 'Erro ao atualizar status do usuário', 
          error: updateStatusError 
        };
      }
    }

    return { 
        success: true, 
        message: 'Pontuação recalculada com sucesso', 
        updatedScore: totalScore 
    };
  } catch (error) {
    console.error('Erro ao recalcular pontuação:', error);
    return { 
      success: false, 
      message: 'Erro ao recalcular pontuação', 
      error: error 
    };
  }
};

export const getUserRankingPosition = async (
  userId: string,
  concursoId: string,
  cota?: string
): Promise<number | null> => {
  try {
    let query = supabase
      .from('user_rankings')
      .select('position')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId);

    if (cota && isPositionThreshold(cota)) {
      query = query.eq('cota', cota);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar posição do usuário:', error);
      return null;
    }

    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('vagas')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar número de vagas:', concursoError);
      return null;
    }

    const vacanciesCount = concurso?.vagas;

    // Corrigir a expressão com o operador > para verificar as posições
    // Verificamos valores válidos antes da comparação
    if (cota && isPositionThreshold(cota) && 
        typeof data?.[0]?.position === 'number' && 
        typeof vacanciesCount === 'number' && 
        data[0].position > vacanciesCount) {
      return null;
    }

    return data?.[0]?.position || null;
  } catch (error) {
    console.error('Erro ao obter posição do usuário:', error);
    return null;
  }
};
