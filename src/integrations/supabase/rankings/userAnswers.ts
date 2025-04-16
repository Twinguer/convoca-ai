
import { supabase } from '../client';

// Function to save user answers and calculate scores
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // First, save the user's answers
    const answersData = answers.map(a => ({
      user_ranking_id: rankingId,
      question_number: a.questionNumber,
      answer: a.answer,
      is_basic_knowledge: a.isBasicKnowledge
    }));
    
    console.log('Saving user answers:', answersData);
    
    // Delete existing answers first
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Insert new answers
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData);
      
    if (insertError) throw insertError;
    
    // Get the official answer key
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    console.log('Official answer key:', answerKey);
    
    // Calculate score by comparing user answers with official answers
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;
    
    answers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.questionNumber
      );
      
      if (officialAnswer && officialAnswer.answer === userAnswer.answer) {
        if (userAnswer.isBasicKnowledge) {
          basicKnowledgeScore += 1;
        } else {
          specificKnowledgeScore += 1;
          
          // Additionally, track specific knowledge sections
          if (officialAnswer.is_specific_1) {
            specific1Score += 1;
          } else if (officialAnswer.is_specific_2) {
            specific2Score += 1;
          } else if (officialAnswer.is_specific_3) {
            specific3Score += 1;
          }
        }
      }
    });
    
    console.log('Calculated raw scores:', {
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score
    });
    
    // Get concurso weights
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_weight,
        specific_knowledge_weight,
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
      
    if (concursoError) {
      console.error('Error fetching concurso weights:', concursoError);
      throw concursoError;
    }
    
    // Get the correct weights
    const basicWeight = concurso?.basic_knowledge_weight || 1;
    const specific1Weight = concurso?.specific_knowledge_1_weight || 
                           concurso?.specific_knowledge_weight || 1;
    const specific2Weight = concurso?.specific_knowledge_2_weight || 1;
    const specific3Weight = concurso?.specific_knowledge_3_weight || 1;
    
    console.log('Retrieved weights from database:', {
      basicWeight,
      specific1Weight,
      specific2Weight,
      specific3Weight,
      fullConcursoData: concurso
    });
    
    // Calculate weighted scores
    const weightedBasicScore = basicKnowledgeScore * basicWeight;
    const weightedSpecific1Score = specific1Score * specific1Weight;
    const weightedSpecific2Score = specific2Score * specific2Weight;
    const weightedSpecific3Score = specific3Score * specific3Weight;
    
    // Get existing subjective scores from user_rankings to include in total score
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
      
    if (rankingError) {
      console.error('Error fetching existing subjective scores:', rankingError);
    }
    
    // Calculate subjective scores with weights
    const discursiveScore = (rankingData?.discursive_score || 0);
    const caseStudy1Score = (rankingData?.case_study_1_score || 0);
    const caseStudy2Score = (rankingData?.case_study_2_score || 0);
    const caseStudy3Score = (rankingData?.case_study_3_score || 0);
    
    const weightedDiscursiveScore = discursiveScore * (concurso?.discursive_weight || 1);
    const weightedCaseStudy1Score = caseStudy1Score * (concurso?.case_study_1_weight || 1);
    const weightedCaseStudy2Score = caseStudy2Score * (concurso?.case_study_2_weight || 1);
    const weightedCaseStudy3Score = caseStudy3Score * (concurso?.case_study_3_weight || 1);
    
    console.log('Subjective scores:', {
      discursiveScore,
      weightedDiscursiveScore,
      caseStudy1Score,
      weightedCaseStudy1Score,
      caseStudy2Score,
      weightedCaseStudy2Score,
      caseStudy3Score,
      weightedCaseStudy3Score
    });
    
    // Calculate total score including subjective scores
    const totalScore = 
      weightedBasicScore + 
      weightedSpecific1Score + 
      weightedSpecific2Score + 
      weightedSpecific3Score +
      weightedDiscursiveScore +
      weightedCaseStudy1Score +
      weightedCaseStudy2Score +
      weightedCaseStudy3Score;
    
    console.log('Weighted scores:', {
      weightedBasicScore,
      weightedSpecific1Score,
      weightedSpecific2Score,
      weightedSpecific3Score,
      totalWithObjective: weightedBasicScore + weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score,
      totalWithSubjective: totalScore,
      weights: {
        basic: basicWeight,
        specific1: specific1Weight,
        specific2: specific2Weight,
        specific3: specific3Weight,
        discursive: concurso?.discursive_weight || 1,
        caseStudy1: concurso?.case_study_1_weight || 1,
        caseStudy2: concurso?.case_study_2_weight || 1,
        caseStudy3: concurso?.case_study_3_weight || 1
      }
    });
    
    // Update user ranking with scores
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
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      basicKnowledgeScore, 
      specificKnowledgeScore, 
      specific1Score,
      specific2Score,
      specific3Score,
      totalScore 
    };
  } catch (error: any) {
    console.error('Error saving answers and calculating score:', error);
    throw error;
  }
};
