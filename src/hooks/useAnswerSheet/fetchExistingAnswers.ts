
import { supabase } from '@/integrations/supabase/client';

interface ConsolidatedAnswerData {
  booklets: {
    [bookletId: string]: {
      answers: { [questionNumber: string]: string };
      metadata: {
        completed_at: string;
        answer_count: number;
        booklet_name?: string;
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

export const fetchExistingAnswers = async (rankingId: string, selectedBookletId?: string) => {
  try {
    console.log('[fetchExistingAnswers] Fetching consolidated answers for ranking ID:', rankingId);
    console.log('[fetchExistingAnswers] Selected booklet ID:', selectedBookletId);

    // Buscar dados consolidados usando nova estrutura
    const { data, error } = await supabase
      .from('user_answers')
      .select('answers_data')
      .eq('user_ranking_id', rankingId)
      .is('question_number', null)
      .single();
      
    if (error) {
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

    // Se há um caderno selecionado, buscar apenas suas respostas
    let answers: { [key: number]: string } = {};
    
    if (selectedBookletId && consolidatedData.booklets?.[selectedBookletId]) {
      // Buscar respostas apenas do caderno selecionado
      const bookletAnswers = consolidatedData.booklets[selectedBookletId].answers;
      if (bookletAnswers) {
        Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
          answers[parseInt(questionNum)] = answer;
        });
      }
      console.log('[fetchExistingAnswers] Loaded answers for selected booklet:', selectedBookletId, answers);
    } else if (!selectedBookletId && consolidatedData.selected_booklet) {
      // Se não há caderno selecionado, mas há um caderno padrão, usar ele
      const defaultBookletId = consolidatedData.selected_booklet;
      if (consolidatedData.booklets?.[defaultBookletId]) {
        const bookletAnswers = consolidatedData.booklets[defaultBookletId].answers;
        if (bookletAnswers) {
          Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
            answers[parseInt(questionNum)] = answer;
          });
        }
        console.log('[fetchExistingAnswers] Loaded answers for default booklet:', defaultBookletId, answers);
      }
    } else {
      // Fallback: combinar todas as respostas (para compatibilidade)
      if (consolidatedData.booklets) {
        Object.values(consolidatedData.booklets).forEach(booklet => {
          if (booklet.answers) {
            Object.entries(booklet.answers).forEach(([questionNum, answer]) => {
              answers[parseInt(questionNum)] = answer;
            });
          }
        });
      }
      console.log('[fetchExistingAnswers] Loaded combined answers from all booklets:', answers);
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
