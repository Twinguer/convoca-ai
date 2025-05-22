
import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    // Get user answers
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log('[fetchExistingAnswers] Respostas existentes encontradas:', data.length);
      
      // Convert answers to the correct format
      const answersMap: { [key: number]: string } = {};
      
      data.forEach(item => {
        // No need to convert question_number as it's now stored as integer in the database
        const questionNumber: number = item.question_number;
        answersMap[questionNumber] = item.answer;
      });
      
      // Get ranking data for subjective scores
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
        .eq('id', rankingId)
        .single();

      return {
        answers: answersMap,
        discursiveScore: rankingData?.discursive_score || 0,
        caseStudy1Score: rankingData?.case_study_1_score || 0, 
        caseStudy2Score: rankingData?.case_study_2_score || 0,
        caseStudy3Score: rankingData?.case_study_3_score || 0
      };
    }
    
    return { answers: {} };
  } catch (error) {
    console.error('[fetchExistingAnswers] Error fetching existing answers:', error);
    return { answers: {} };
  }
};
