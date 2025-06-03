
import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Fetching consolidated answers for ranking ID:', rankingId);

    // Buscar dados consolidados da nova estrutura
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('answers_data')
      .eq('user_ranking_id', rankingId)
      .single();

    if (answersError && answersError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw answersError;
    }

    console.log('[fetchExistingAnswers] Fetched consolidated data:', answersData);

    let answers: { [key: number]: string } = {};
    let discursiveScore = null;
    let caseStudy1Score = null;
    let caseStudy2Score = null;
    let caseStudy3Score = null;
    
    if (answersData?.answers_data) {
      const consolidatedData = answersData.answers_data;
      
      // Extrair respostas de todos os cadernos
      if (consolidatedData.booklets) {
        Object.values(consolidatedData.booklets).forEach((booklet: any) => {
          if (booklet.answers) {
            Object.entries(booklet.answers).forEach(([questionNum, answer]) => {
              answers[parseInt(questionNum)] = answer as string;
            });
          }
        });
      }
      
      // Extrair scores subjetivos
      if (consolidatedData.subjective_scores) {
        discursiveScore = consolidatedData.subjective_scores.discursive;
        caseStudy1Score = consolidatedData.subjective_scores.case_study_1;
        caseStudy2Score = consolidatedData.subjective_scores.case_study_2;
        caseStudy3Score = consolidatedData.subjective_scores.case_study_3;
      }
    }

    // Se não há dados consolidados, buscar também de user_rankings para scores subjetivos
    if (!answersData?.answers_data) {
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
        .eq('id', rankingId)
        .single();

      if (!rankingError && rankingData) {
        discursiveScore = rankingData.discursive_score;
        caseStudy1Score = rankingData.case_study_1_score;
        caseStudy2Score = rankingData.case_study_2_score;
        caseStudy3Score = rankingData.case_study_3_score;
      }
    }

    console.log('[fetchExistingAnswers] Processed answers:', {
      answersCount: Object.keys(answers).length,
      discursiveScore,
      caseStudy1Score,
      caseStudy2Score,
      caseStudy3Score
    });

    return {
      answers,
      discursiveScore,
      caseStudy1Score,
      caseStudy2Score,
      caseStudy3Score,
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Error fetching consolidated answers:', error);
    return {
      answers: {},
      discursiveScore: null,
      caseStudy1Score: null,
      caseStudy2Score: null,
      caseStudy3Score: null,
    };
  }
};
