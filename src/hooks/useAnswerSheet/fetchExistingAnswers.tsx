
import { supabase } from '@/integrations/supabase/client';
import { SectionType } from '@/types/concursos';
import { fetchUserAnswers } from '@/integrations/supabase/rankings/userAnswers';

export const fetchExistingAnswers = async (
  rankingId: string,
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>,
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: SectionType }>>,
  setDiscursiveScore: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy1Score: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy2Score: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy3Score: React.Dispatch<React.SetStateAction<number | null>>
) => {
  try {
    console.log('Fetching existing answers for ranking ID:', rankingId);
    
    // Get user answers
    const answerData = await fetchUserAnswers(rankingId);
    
    if (answerData && answerData.length > 0) {
      console.log('[fetchExistingAnswers] Respostas existentes encontradas:', answerData.length);
      
      // Convert answers to the correct format
      const answersMap: { [key: number]: string } = {};
      const questionTypeMap: { [key: number]: SectionType } = {};
      
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
    } else {
      console.log('Fetched answers data:', answerData);
    }
    
    // Get ranking data for subjective scores
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('id', rankingId)
      .single();
      
    if (rankingData) {
      console.log('Fetched ranking data:', rankingData);
      
      setDiscursiveScore(
        rankingData.discursive_score !== null && rankingData.discursive_score !== undefined
          ? rankingData.discursive_score
          : null
      );
      setCaseStudy1Score(
        rankingData.case_study_1_score !== null && rankingData.case_study_1_score !== undefined
          ? rankingData.case_study_1_score
          : null
      );
      setCaseStudy2Score(
        rankingData.case_study_2_score !== null && rankingData.case_study_2_score !== undefined
          ? rankingData.case_study_2_score
          : null
      );
      setCaseStudy3Score(
        rankingData.case_study_3_score !== null && rankingData.case_study_3_score !== undefined
          ? rankingData.case_study_3_score
          : null
      );
    }
  } catch (error) {
    console.error('[fetchExistingAnswers] Error fetching existing answers:', error);
  }
};
