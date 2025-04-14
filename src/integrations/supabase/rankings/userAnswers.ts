
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
    
    // Calculate total score
    const totalScore = basicKnowledgeScore + specificKnowledgeScore;
    
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
