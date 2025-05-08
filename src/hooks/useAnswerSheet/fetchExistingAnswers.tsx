
import { supabase } from '@/integrations/supabase/client';
import { Dispatch, SetStateAction } from 'react';

export const fetchExistingAnswers = async (
  rankingId: string,
  setAnswers: Dispatch<SetStateAction<{ [key: number]: string }>>,
  setQuestionType: Dispatch<SetStateAction<{ [key: number]: string }>>,
  setDiscursiveScore: Dispatch<SetStateAction<number | null>>,
  setCaseStudy1Score: Dispatch<SetStateAction<number | null>>,
  setCaseStudy2Score: Dispatch<SetStateAction<number | null>>,
  setCaseStudy3Score: Dispatch<SetStateAction<number | null>>
) => {
  try {
    console.log('Fetching existing answers for ranking ID:', rankingId);
    
    // Fetch answers
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) throw answersError;
    
    console.log('Fetched answers data:', answersData);
    
    if (answersData?.length) {
      const answersMap: { [key: number]: string } = {};
      const typesMap: { [key: number]: string } = {};
      
      answersData.forEach((item: any) => {
        const questionNumber = item.question_number;
        answersMap[questionNumber] = item.answer;
        
        if (item.is_basic_knowledge) {
          typesMap[questionNumber] = 'basic';
        } else if (item.is_specific_1) {
          typesMap[questionNumber] = 'specific1';
        } else if (item.is_specific_2) {
          typesMap[questionNumber] = 'specific2';
        } else if (item.is_specific_3) {
          typesMap[questionNumber] = 'specific3';
        }
      });
      
      console.log('Parsed answers map:', answersMap);
      console.log('Parsed question types map:', typesMap);
      
      setAnswers(answersMap);
      setQuestionType(typesMap);
    }
    
    // Fetch user ranking for scores
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
      
    if (rankingError) throw rankingError;
    
    console.log('Fetched ranking data:', rankingData);
    
    if (rankingData) {
      if (rankingData.discursive_score !== null && rankingData.discursive_score !== undefined) {
        setDiscursiveScore(rankingData.discursive_score);
      }
      
      if (rankingData.case_study_1_score !== undefined) {
        setCaseStudy1Score(rankingData.case_study_1_score);
      }
      
      if (rankingData.case_study_2_score !== undefined) {
        setCaseStudy2Score(rankingData.case_study_2_score);
      }
      
      if (rankingData.case_study_3_score !== undefined) {
        setCaseStudy3Score(rankingData.case_study_3_score);
      }
    }
  } catch (error) {
    console.error('Error fetching answers:', error);
  }
};
