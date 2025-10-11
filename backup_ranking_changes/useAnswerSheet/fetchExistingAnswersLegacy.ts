import { supabase } from '@/integrations/supabase/client';

// Busca respostas existentes usando a ESTRUTURA ANTIGA (user_answers, user_rankings)
// Este adaptador conecta AnswerSheet com as tabelas antigas
export const fetchExistingAnswersLegacy = async (rankingId: string) => {
  try {
    // 1) Buscar dados do ranking na estrutura antiga
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        concurso_id,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        selected_booklet,
        edit_count
      `)
      .eq('id', rankingId)
      .maybeSingle();

    if (rankingError || !rankingData) {
      console.error('[fetchExistingAnswersLegacy] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    // 2) Buscar respostas consolidadas na tabela user_answers
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('answers_data')
      .eq('user_ranking_id', rankingId)
      .is('question_number', null)
      .maybeSingle();

    if (answersError) {
      console.error('[fetchExistingAnswersLegacy] Erro ao buscar respostas:', answersError);
      return {};
    }

    // 3) Extrair respostas do caderno selecionado
    let answers: { [key: number]: string } = {};
    let selectedBooklet = rankingData.selected_booklet?.toString() || 'default';

    if (answersData?.answers_data?.booklets) {
      const bookletData = answersData.answers_data.booklets[selectedBooklet];
      if (bookletData?.answers) {
        Object.entries(bookletData.answers).forEach(([questionNum, answer]) => {
          const num = parseInt(questionNum);
          if (!isNaN(num) && typeof answer === 'string') {
            answers[num] = answer;
          }
        });
      }
    }

    // 4) Extrair scores subjetivos
    const subjectiveScores = answersData?.answers_data?.subjective_scores || {};
    
    return {
      answers,
      discursiveScore: rankingData.discursive_score || subjectiveScores.discursive || null,
      caseStudy1Score: rankingData.case_study_1_score || subjectiveScores.case_study_1 || null,
      caseStudy2Score: rankingData.case_study_2_score || subjectiveScores.case_study_2 || null,
      caseStudy3Score: rankingData.case_study_3_score || subjectiveScores.case_study_3 || null,
      selectedBooklet: selectedBooklet,
      editCount: rankingData.edit_count || 0,
      consolidatedData: answersData?.answers_data || null,
    };
  } catch (error) {
    console.error('[fetchExistingAnswersLegacy] Erro ao buscar respostas:', error);
    return {};
  }
};

