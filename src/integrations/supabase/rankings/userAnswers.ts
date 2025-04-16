
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
    
    answers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.questionNumber
      );
      
      if (officialAnswer && officialAnswer.answer === userAnswer.answer) {
        if (userAnswer.isBasicKnowledge) {
          basicKnowledgeScore += 1;
        } else {
          specificKnowledgeScore += 1;
        }
      }
    });
    
    console.log('Calculated scores:', {
      basicKnowledgeScore,
      specificKnowledgeScore
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
    
    // Get the correct weights, using either the specific numbered weights or the legacy weight
    const basicWeight = concurso?.basic_knowledge_weight || 1;
    const specificWeight = concurso?.specific_knowledge_1_weight || 
                          concurso?.specific_knowledge_weight || 1;
    
    console.log('Retrieved weights from database:', {
      basicWeight,
      specificWeight,
      fullConcursoData: concurso
    });
    
    // Calculate weighted scores
    const weightedBasicScore = basicKnowledgeScore * basicWeight;
    const weightedSpecificScore = specificKnowledgeScore * specificWeight;
    
    // Calculate total score
    const totalScore = weightedBasicScore + weightedSpecificScore;
    
    console.log('Weighted scores:', {
      weightedBasicScore,
      weightedSpecificScore,
      totalScore,
      weights: {
        basic: basicWeight,
        specific: specificWeight
      }
    });
    
    // Update user ranking with scores
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        basic_knowledge_score: basicKnowledgeScore,
        specific_knowledge_score: specificKnowledgeScore,
        score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      basicKnowledgeScore, 
      specificKnowledgeScore, 
      totalScore 
    };
  } catch (error: any) {
    console.error('Error saving answers and calculating score:', error);
    throw error;
  }
};
