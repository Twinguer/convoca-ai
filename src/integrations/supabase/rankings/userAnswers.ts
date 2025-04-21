import { supabase } from '../client';

// Function to save user answers and calculate scores
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // Primeiramente, salve as respostas do usuário
    const answersData = answers.map(a => {
      const qNum = a.questionNumber;

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: a.isBasicKnowledge,
        is_specific_1: !a.isBasicKnowledge && a.questionNumber <= 0, // Ajustado depois
        is_specific_2: !a.isBasicKnowledge && a.questionNumber <= 0,
        is_specific_3: !a.isBasicKnowledge && a.questionNumber <= 0
      };
    });
    
    console.log('Saving user answers:', answersData);
    
    // Delete existing answers first
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Carregue os dados do concurso para determinar as faixas das seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions
      `)
      .eq('id', concursoId)
      .single();
    if (concursoError) throw concursoError;

    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);

    // Corrija as flags para as seções corretamente, usando is_basic_knowledge
    answersData.forEach(item => {
      const qNum = item.question_number;
      if (qNum <= basicEnd) {
        item.is_basic_knowledge = true;
        item.is_specific_1 = false;
        item.is_specific_2 = false;
        item.is_specific_3 = false;
      } else if (qNum <= specific1End) {
        item.is_basic_knowledge = false;
        item.is_specific_1 = true;
        item.is_specific_2 = false;
        item.is_specific_3 = false;
      } else if (qNum <= specific2End) {
        item.is_basic_knowledge = false;
        item.is_specific_1 = false;
        item.is_specific_2 = true;
        item.is_specific_3 = false;
      } else {
        item.is_basic_knowledge = false;
        item.is_specific_1 = false;
        item.is_specific_2 = false;
        item.is_specific_3 = true;
      }
    });

    console.log('Updated answers with correct section flags:', answersData);
    
    // Insert new answers
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData);
      
    if (insertError) throw insertError;

    // Obtenha o gabarito oficial
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*, is_nullified')
      .eq('concurso_id', concursoId);
    if (keyError) throw keyError;
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    // Cálculo das notas brutas SEM aplicar pesos
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;

    answers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.questionNumber
      );

      // Use userAnswer.is_basic_knowledge corretamente
      const is_basic_knowledge = userAnswer.isBasicKnowledge !== undefined
        ? userAnswer.isBasicKnowledge
        : (userAnswer as any).is_basic_knowledge;

      if (officialAnswer && (officialAnswer.is_nullified || officialAnswer.answer === userAnswer.answer)) {
        if (is_basic_knowledge) {
          basicKnowledgeScore += 1;
        } else {
          specificKnowledgeScore += 1;

          const qNum = userAnswer.questionNumber;
          if (qNum > basicEnd && qNum <= specific1End) {
            specific1Score += 1;
          } else if (qNum > specific1End && qNum <= specific2End) {
            specific2Score += 1;
          } else if (qNum > specific2End) {
            specific3Score += 1;
          }
        }
      }
    });

    // Obtenha os pesos do concurso
    const { data: concursoWithWeights, error: concursoWeightsError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight
      `)
      .eq('id', concursoId)
      .single();
    if (concursoWeightsError) throw concursoWeightsError;
    
    const weights = {
      basicKnowledge: concursoWithWeights?.basic_knowledge_weight || 1,
      specificKnowledge1: concursoWithWeights?.specific_knowledge_1_weight || 1,
      specificKnowledge2: concursoWithWeights?.specific_knowledge_2_weight || 1,
      specificKnowledge3: concursoWithWeights?.specific_knowledge_3_weight || 1,
      discursive: concursoWithWeights?.discursive_weight || 1,
      caseStudy1: concursoWithWeights?.case_study_1_weight || 1,
      caseStudy2: concursoWithWeights?.case_study_2_weight || 1,
      caseStudy3: concursoWithWeights?.case_study_3_weight || 1
    };

    // Obtenha as notas subjetivas salvas, SEM aplicar pesos ainda
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score
      `)
      .eq('id', rankingId)
      .single();
    
    // Calcule as notas ponderadas
    const weighted_basic_score = basicKnowledgeScore * weights.basicKnowledge;
    const weighted_specific_1_score = specific1Score * weights.specificKnowledge1;
    const weighted_specific_2_score = specific2Score * weights.specificKnowledge2;
    const weighted_specific_3_score = specific3Score * weights.specificKnowledge3;
    const weighted_discursive_score = (rankingData?.discursive_score || 0) * weights.discursive;
    const weighted_case_study_1_score = (rankingData?.case_study_1_score || 0) * weights.caseStudy1;
    const weighted_case_study_2_score = (rankingData?.case_study_2_score || 0) * weights.caseStudy2;
    const weighted_case_study_3_score = (rankingData?.case_study_3_score || 0) * weights.caseStudy3;

    const totalScore = 
      weighted_basic_score +
      weighted_specific_1_score +
      weighted_specific_2_score +
      weighted_specific_3_score +
      weighted_discursive_score +
      weighted_case_study_1_score +
      weighted_case_study_2_score +
      weighted_case_study_3_score;

    // Atualiza as notas no ranking do usuário: salve OS DOIS tipos de nota!
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        basic_knowledge_score: basicKnowledgeScore,
        specific_knowledge_score: specificKnowledgeScore,
        specific_knowledge_1_score: specific1Score,
        specific_knowledge_2_score: specific2Score,
        specific_knowledge_3_score: specific3Score,
        weighted_basic_score,
        weighted_specific_1_score,
        weighted_specific_2_score,
        weighted_specific_3_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
    if (updateError) throw updateError;

    return {
      success: true,
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score,
      weighted_basic_score,
      weighted_specific_1_score,
      weighted_specific_2_score,
      weighted_specific_3_score,
      weighted_discursive_score,
      weighted_case_study_1_score,
      weighted_case_study_2_score,
      weighted_case_study_3_score,
      totalScore
    };
  } catch (error: any) {
    console.error('Error saving answers and calculating score:', error);
    throw error;
  }
};

// New function to recalculate scores for all users when answer key or exam structure changes
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`Recalculating scores for all users in concurso: ${concursoId}`);
    
    // Get all user rankings for this concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('No user rankings found for this concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`Found ${userRankings.length} user rankings to update`);
    
    // Get exam structure and weights
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions,
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Get answer key with nullified questions
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*, is_nullified')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      console.log('No answer key found for this concurso');
      return { success: false, error: 'Gabarito oficial não encontrado' };
    }
    
    // Process each user ranking
    let updatedCount = 0;
    for (const ranking of userRankings) {
      // Get user answers
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', ranking.id);
        
      if (answersError) {
        console.error(`Error fetching answers for user ranking ${ranking.id}:`, answersError);
        continue;
      }
      
      if (!userAnswers || userAnswers.length === 0) {
        console.log(`No answers found for user ranking ${ranking.id}`);
        continue;
      }
      
      // Calculate scores using the same logic as in saveUserAnswers
      // Calculate question ranges
      const basicEnd = concurso.basic_knowledge_questions || 0;
      const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
      const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
      
      // Calculate raw scores
      let basicKnowledgeScore = 0;
      let specificKnowledgeScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;
      
      userAnswers.forEach(userAnswer => {
        const officialAnswer = answerKey.find(
          a => a.question_number === userAnswer.question_number
        );
        
        // Award points for nullified questions or correct answers
        if (officialAnswer && (officialAnswer.is_nullified || officialAnswer.answer === userAnswer.answer)) {
          if (userAnswer.is_basic_knowledge) {
            basicKnowledgeScore += 1;
          } else if (userAnswer.is_specific_1) {
            specific1Score += 1;
            specificKnowledgeScore += 1;
          } else if (userAnswer.is_specific_2) {
            specific2Score += 1;
            specificKnowledgeScore += 1;
          } else if (userAnswer.is_specific_3) {
            specific3Score += 1;
            specificKnowledgeScore += 1;
          }
        }
      });
      
      // Get subjective scores
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
        console.error(`Error fetching subjective scores for ranking ${ranking.id}:`, rankingError);
        continue;
      }
      
      // Get weights
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;
      
      // Calculate weighted scores
      const weightedBasicScore = basicKnowledgeScore * basicWeight;
      const weightedSpecific1Score = specific1Score * specific1Weight;
      const weightedSpecific2Score = specific2Score * specific2Weight;
      const weightedSpecific3Score = specific3Score * specific3Weight;
      
      // Add subjective scores
      const discursiveScore = (rankingData?.discursive_score || 0);
      const caseStudy1Score = (rankingData?.case_study_1_score || 0);
      const caseStudy2Score = (rankingData?.case_study_2_score || 0);
      const caseStudy3Score = (rankingData?.case_study_3_score || 0);
      
      const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
      const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
      const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
      const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);
      
      // Calculate total score
      const totalScore = 
        weightedBasicScore + 
        weightedSpecific1Score + 
        weightedSpecific2Score + 
        weightedSpecific3Score +
        weightedDiscursiveScore +
        weightedCaseStudy1Score +
        weightedCaseStudy2Score +
        weightedCaseStudy3Score;
      
      // Update the ranking
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          specific_knowledge_1_score: specific1Score,
          specific_knowledge_2_score: specific2Score,
          specific_knowledge_3_score: specific3Score,
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', ranking.id);
        
      if (updateError) {
        console.error(`Error updating scores for ranking ${ranking.id}:`, updateError);
        continue;
      }
      
      updatedCount++;
    }
    
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error recalculating all user scores:', error);
    throw error;
  }
};
