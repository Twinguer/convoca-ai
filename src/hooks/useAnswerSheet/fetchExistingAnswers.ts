
import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Fetching existing answers for ranking ID:', rankingId);

    // Fetch answers using new JSONB structure with fallback to old structure
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);

    if (answersError) throw answersError;

    console.log('[fetchExistingAnswers] Fetched answers data:', answersData);

    const answers: { [key: number]: string } = {};
    
    if (answersData?.length) {
      answersData.forEach((item: any) => {
        // Use new JSONB structure with fallback to old column
        const answer = item.answers_data?.objective_answer || item.answer;
        if (answer) {
          answers[item.question_number] = answer;
        }
      });
    }

    // Fetch user ranking for scores
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();

    if (rankingError) throw rankingError;

    console.log('[fetchExistingAnswers] Fetched ranking data:', rankingData);

    return {
      answers,
      discursiveScore: rankingData?.discursive_score,
      caseStudy1Score: rankingData?.case_study_1_score,
      caseStudy2Score: rankingData?.case_study_2_score,
      caseStudy3Score: rankingData?.case_study_3_score,
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Error fetching answers:', error);
    return {
      answers: {},
      discursiveScore: null,
      caseStudy1Score: null,
      caseStudy2Score: null,
      caseStudy3Score: null,
    };
  }
};
