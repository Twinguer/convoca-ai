
import { supabase } from '@/integrations/supabase/client';
import { fetchUserAnswers } from '@/integrations/supabase/rankings/userAnswers';

export const fetchExistingAnswers = async (
  rankingId: string,
  setAnswers: (answers: { [key: number]: string }) => void,
  setQuestionType: (questionType: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' }) => void,
  setDiscursiveScore: (score: number | null) => void,
  setCaseStudy1Score: (score: number | null) => void,
  setCaseStudy2Score: (score: number | null) => void,
  setCaseStudy3Score: (score: number | null) => void
) => {
  try {
    // Get user answers
    const answerData = await fetchUserAnswers(rankingId);
    
    if (answerData && answerData.length > 0) {
      console.log('[fetchExistingAnswers] Respostas existentes encontradas:', answerData.length);
      
      // Convert answers to the correct format
      const answersMap: { [key: number]: string } = {};
      const questionTypeMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' } = {};
      
      answerData.forEach(item => {
        // No need to convert question_number as it's now stored as integer in the database
        const questionNumber: number = item.question_number;
        answersMap[questionNumber] = item.answer;
        
        // Determine question type
        if (item.is_basic_knowledge) {
          questionTypeMap[questionNumber] = 'basic';
        } else if (item.is_specific_1) {
          questionTypeMap[questionNumber] = 'specific1';
        } else if (item.is_specific_2) {
          questionTypeMap[questionNumber] = 'specific2';
        } else if (item.is_specific_3) {
          questionTypeMap[questionNumber] = 'specific3';
        }
      });
      
      // Set state values
      setAnswers(answersMap);
      setQuestionType(questionTypeMap);
      
      // Get ranking data for subjective scores
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
        .eq('id', rankingId)
        .single();
        
      if (rankingData) {
        setDiscursiveScore(rankingData.discursive_score);
        setCaseStudy1Score(rankingData.case_study_1_score);
        setCaseStudy2Score(rankingData.case_study_2_score);
        setCaseStudy3Score(rankingData.case_study_3_score);
      }
    }
  } catch (error) {
    console.error('[fetchExistingAnswers] Error fetching existing answers:', error);
  }
};
