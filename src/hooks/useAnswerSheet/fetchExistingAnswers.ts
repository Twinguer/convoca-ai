
import { supabase } from '@/integrations/supabase/client';

interface ConsolidatedAnswerData {
  booklets: {
    [bookletId: string]: {
      answers: { [questionNumber: string]: string };
      metadata: {
        completed_at: string;
        answer_count: number;
      };
    };
  };
  subjective_scores: {
    discursive: number;
    case_study_1: number;
    case_study_2: number;
    case_study_3: number;
  };
  selected_booklet: string;
  total_edit_count: number;
  metadata: {
    last_updated: string;
    version: string;
  };
}

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Fetching consolidated answers for ranking ID:', rankingId);

    // Buscar dados consolidados usando nova estrutura
    const { data, error } = await supabase
      .from('user_answers')
      .select('answers_data')
      .eq('user_ranking_id', rankingId)
      .is('question_number', null)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('[fetchExistingAnswers] Error:', error);
      return {
        answers: {},
        editCount: 0,
        discursiveScore: null,
        caseStudy1Score: null,
        caseStudy2Score: null,
        caseStudy3Score: null,
        selectedBooklet: null
      };
    }

    if (!data?.answers_data) {
      console.log('[fetchExistingAnswers] No consolidated data found');
      return {
        answers: {},
        editCount: 0,
        discursiveScore: null,
        caseStudy1Score: null,
        caseStudy2Score: null,
        caseStudy3Score: null,
        selectedBooklet: null
      };
    }

    const consolidatedData = data.answers_data as ConsolidatedAnswerData;
    console.log('[fetchExistingAnswers] Retrieved consolidated data:', consolidatedData);

    // Extrair respostas de todos os cadernos para compatibilidade
    const answers: { [key: number]: string } = {};
    
    if (consolidatedData.booklets) {
      Object.values(consolidatedData.booklets).forEach(booklet => {
        if (booklet.answers) {
          Object.entries(booklet.answers).forEach(([questionNum, answer]) => {
            answers[parseInt(questionNum)] = answer;
          });
        }
      });
    }

    return {
      answers,
      discursiveScore: consolidatedData.subjective_scores?.discursive || null,
      caseStudy1Score: consolidatedData.subjective_scores?.case_study_1 || null,
      caseStudy2Score: consolidatedData.subjective_scores?.case_study_2 || null,
      caseStudy3Score: consolidatedData.subjective_scores?.case_study_3 || null,
      selectedBooklet: consolidatedData.selected_booklet || null,
      editCount: consolidatedData.total_edit_count || 0
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro ao buscar respostas consolidadas:', error);
    return {
      answers: {},
      editCount: 0,
      discursiveScore: null,
      caseStudy1Score: null,
      caseStudy2Score: null,
      caseStudy3Score: null,
      selectedBooklet: null
    };
  }
};
