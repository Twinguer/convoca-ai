import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // Buscar dados consolidados diretamente da tabela user_rankings
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('consolidated_data, selected_booklet, subject_scores, concurso_id, user_id, edit_count')
      .eq('id', rankingId)
      .maybeSingle();

    if (rankingError || !rankingData) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    console.log('[fetchExistingAnswers] Dados do ranking encontrados:', rankingData);

    // Verificar se há dados consolidados
    if (!rankingData.consolidated_data || rankingData.consolidated_data === '{}') {
      console.log('[fetchExistingAnswers] Nenhum dado consolidado encontrado');
      return {
        answers: {},
        discursiveScore: null,
        caseStudy1Score: null,
        caseStudy2Score: null,
        caseStudy3Score: null,
        otherSubjectiveScore: null,
        subjectScores: rankingData.subject_scores || {},
        selectedBooklet: rankingData.selected_booklet,
        editCount: rankingData.edit_count || 0
      };
    }

    const consolidatedData = rankingData.consolidated_data;
    const selectedBooklet = rankingData.selected_booklet;
    const userId = rankingData.user_id;

    console.log('[fetchExistingAnswers] Dados consolidados encontrados:', consolidatedData);

    let answers: { [key: number]: string } = {};
    let subjectiveScores = {};

        // Extrair dados usando a estrutura de backup: users -> user_id -> booklets -> booklet_id -> answers
        const userData = consolidatedData.users?.[userId];
        if (userData?.booklets) {
          const bookletId = selectedBooklet || Object.keys(userData.booklets)[0];
          if (bookletId && userData.booklets[bookletId]?.answers) {
            const bookletAnswers = userData.booklets[bookletId].answers;
            
            // Processar estrutura simples (questionNum -> answer)
            Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
              answers[parseInt(questionNum)] = answer as string;
            });
          }
        }

    // Extrair pontuações subjetivas usando a estrutura de backup: users -> user_id -> subjective_scores
    if (userData?.subjective_scores) {
      subjectiveScores = userData.subjective_scores;
    }

    console.log('[fetchExistingAnswers] Respostas finais:', answers);
    console.log('[fetchExistingAnswers] Pontuações subjetivas:', subjectiveScores);
    console.log('[fetchExistingAnswers] Número de respostas encontradas:', Object.keys(answers).length);

    return {
      answers,
      discursiveScore: subjectiveScores?.discursive || null,
      caseStudy1Score: subjectiveScores?.case_study_1 || null,
      caseStudy2Score: subjectiveScores?.case_study_2 || null,
      caseStudy3Score: subjectiveScores?.case_study_3 || null,
      otherSubjectiveScore: subjectiveScores?.other_subjective || null,
      subjectScores: subjectiveScores || {},
      selectedBooklet: selectedBooklet,
      editCount: rankingData.edit_count || 0,
      consolidatedData: consolidatedData
    };

  } catch (error) {
    console.error('[fetchExistingAnswers] Erro geral:', error);
    return {};
  }
};