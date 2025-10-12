import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // Primeiro, buscar informações do user_ranking para obter o caderno selecionado
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('id', rankingId)
      .maybeSingle();

    if (rankingError || !rankingData) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    console.log('[fetchExistingAnswers] Dados do ranking:', rankingData);

    // Buscar respostas diretamente da tabela user_answers (NOVA ESTRUTURA)
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('question_number, answer, booklet_id')
      .eq('user_ranking_id', rankingId);

    if (userAnswersError) {
      console.error('[fetchExistingAnswers] Erro ao buscar respostas:', userAnswersError);
      return {};
    }

    console.log('[fetchExistingAnswers] Respostas encontradas:', userAnswers);

    let answers: { [key: number]: string } = {};

    if (userAnswers && userAnswers.length > 0) {
      // Filtrar respostas do caderno selecionado se houver
      const selectedBookletId = rankingData.selected_booklet?.toString();
      let filteredAnswers = userAnswers;
      
      if (selectedBookletId) {
        filteredAnswers = userAnswers.filter(answer => 
          answer.booklet_id === selectedBookletId || !answer.booklet_id
        );
        console.log('[fetchExistingAnswers] Respostas filtradas para caderno:', selectedBookletId, filteredAnswers);
      }

      // Converter para formato esperado (número da questão como chave)
      filteredAnswers.forEach(answer => {
        answers[answer.question_number] = answer.answer;
      });
    }

    console.log('[fetchExistingAnswers] Respostas finais:', answers);
    console.log('[fetchExistingAnswers] Número de respostas encontradas:', Object.keys(answers).length);

    return {
      answers,
      discursiveScore: rankingData.discursive_score,
      caseStudy1Score: rankingData.case_study_1_score,
      caseStudy2Score: rankingData.case_study_2_score,
      caseStudy3Score: rankingData.case_study_3_score
    };

  } catch (error) {
    console.error('[fetchExistingAnswers] Erro geral:', error);
    return {};
  }
};