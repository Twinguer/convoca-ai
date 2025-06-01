
import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string, bookletId?: string) => {
  try {
    // Primeiro buscar qual caderno o usuário selecionou
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) throw rankingError;
    
    const userBookletId = bookletId || rankingData?.selected_booklet;
    
    if (!userBookletId) {
      console.log('[fetchExistingAnswers] Nenhum caderno selecionado ainda');
      return { answers: {} };
    }

    // Buscar respostas do usuário para o caderno específico
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId)
      .eq('booklet_id', userBookletId);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log('[fetchExistingAnswers] Respostas existentes encontradas:', data.length);
      
      // Convert answers to the correct format
      const answersMap: { [key: number]: string } = {};
      
      data.forEach(item => {
        const questionNumber: number = item.question_number;
        answersMap[questionNumber] = item.answer;
      });
      
      // Get ranking data for subjective scores
      const { data: userRankingData, error: userRankingError } = await supabase
        .from('user_rankings')
        .select(`
          discursive_score, 
          case_study_1_score, 
          case_study_2_score, 
          case_study_3_score,
          weighted_discursive_score,
          weighted_case_study_1_score,
          weighted_case_study_2_score,
          weighted_case_study_3_score,
          customDisciplineScores,
          weightedCustomDisciplineScores
        `)
        .eq('id', rankingId)
        .single();
        
      if (userRankingError) {
        console.error('[fetchExistingAnswers] Error fetching ranking data:', userRankingError);
      }

      return {
        answers: answersMap,
        discursiveScore: userRankingData?.discursive_score || 0,
        caseStudy1Score: userRankingData?.case_study_1_score || 0, 
        caseStudy2Score: userRankingData?.case_study_2_score || 0,
        caseStudy3Score: userRankingData?.case_study_3_score || 0,
        weightedDiscursiveScore: userRankingData?.weighted_discursive_score || 0,
        weightedCaseStudy1Score: userRankingData?.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: userRankingData?.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: userRankingData?.weighted_case_study_3_score || 0,
        customDisciplineScores: userRankingData?.customDisciplineScores || {},
        weightedCustomDisciplineScores: userRankingData?.weightedCustomDisciplineScores || {},
        selectedBookletId: userBookletId
      };
    }
    
    return { 
      answers: {},
      selectedBookletId: userBookletId
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Error fetching existing answers:', error);
    return { answers: {} };
  }
};
