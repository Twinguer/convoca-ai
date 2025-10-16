import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // Buscar dados do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[fetchExistingAnswers] Usuário não autenticado');
      return {};
    }

    // Buscar dados consolidados usando user_id
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('consolidated_data')
      .eq('user_id', user.id)
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
        subjectScores: {},
        selectedBooklet: null,
        editCount: 0
      };
    }

    const consolidatedData = rankingData.consolidated_data;
    const userId = user.id;
    
    // Buscar selected_booklet_id da estrutura atual
    let selectedBooklet = null;
    if (consolidatedData?.rankings?.[rankingId]?.selected_booklet_id) {
      selectedBooklet = consolidatedData.rankings[rankingId].selected_booklet_id;
    }

    console.log('[fetchExistingAnswers] Dados consolidados encontrados:', consolidatedData);

    let answers: { [key: number]: string } = {};
    let subjectiveScores = {};

    // NOVA ESTRUTURA: consolidated_data.rankings[rankingId].user_data
    const rankings = consolidatedData.rankings;
    if (rankings) {
      // Encontrar o ranking específico pelo rankingId
      const rankingData = rankings[rankingId];
      if (rankingData?.user_data) {
        // Extrair respostas da estrutura atual
        if (rankingData.user_data.answers) {
          Object.entries(rankingData.user_data.answers).forEach(([questionNum, answer]) => {
            const questionNumber = parseInt(questionNum);
            if (!isNaN(questionNumber)) {
              answers[questionNumber] = answer as string;
            }
          });
        }

        // Extrair pontuações subjetivas da estrutura atual
        if (rankingData.user_data.subjective_scores) {
          subjectiveScores = rankingData.user_data.subjective_scores;
        }
      }
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
      otherSubjectiveScore: subjectiveScores?.other || null,
      subjectScores: subjectiveScores || {},
      selectedBooklet: selectedBooklet,
      editCount: consolidatedData?.rankings?.[rankingId]?.user_data?.edit_count || 0,
      consolidatedData: consolidatedData
    };

  } catch (error) {
    console.error('[fetchExistingAnswers] Erro geral:', error);
    return {};
  }
};