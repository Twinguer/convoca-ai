import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    // console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // Primeiro, buscar informações do user_ranking para obter o caderno selecionado e concurso_id
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, subject_scores, concurso_id, user_id')
      .eq('id', rankingId)
      .maybeSingle();

    if (rankingError || !rankingData) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    // console.log('[fetchExistingAnswers] Dados do ranking:', rankingData);

    // Buscar respostas da tabela consolidated_answers_by_concurso
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .single();

    if (consolidatedError || !consolidatedData) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados consolidados:', consolidatedError);
      return {
        answers: {},
        discursiveScore: rankingData.discursive_score,
        caseStudy1Score: rankingData.case_study_1_score,
        caseStudy2Score: rankingData.case_study_2_score,
        caseStudy3Score: rankingData.case_study_3_score
      };
    }

    console.log('[fetchExistingAnswers] Dados consolidados encontrados:', consolidatedData.consolidated_data);

    let answers: { [key: number]: string } = {};

    // Extrair respostas do usuário específico
    const userData = consolidatedData.consolidated_data?.users?.[rankingData.user_id];
    if (userData?.booklets) {
      const selectedBookletId = rankingData.selected_booklet?.toString();
      
      // Buscar respostas do caderno selecionado
      const bookletData = selectedBookletId ? userData.booklets[selectedBookletId] : null;
      
      if (bookletData?.answers) {
        // Converter para formato esperado (número da questão como chave)
        Object.entries(bookletData.answers).forEach(([questionNumber, answer]) => {
          const questionNum = parseInt(questionNumber);
          if (!isNaN(questionNum)) {
            answers[questionNum] = answer as string;
          }
        });
      }
    }

    console.log('[fetchExistingAnswers] Respostas finais:', answers);
    console.log('[fetchExistingAnswers] Número de respostas encontradas:', Object.keys(answers).length);

    return {
      answers,
      discursiveScore: rankingData.discursive_score,
      caseStudy1Score: rankingData.case_study_1_score,
      caseStudy2Score: rankingData.case_study_2_score,
      caseStudy3Score: rankingData.case_study_3_score,
      subjectScores: rankingData.subject_scores || {}
    };

  } catch (error) {
    console.error('[fetchExistingAnswers] Erro geral:', error);
    return {};
  }
};