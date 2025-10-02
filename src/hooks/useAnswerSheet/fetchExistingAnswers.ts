
import { supabase } from '@/integrations/supabase/client';

// Busca respostas existentes usando a NOVA estrutura consolidada por concurso
// Retorna também as notas subjetivas e o caderno selecionado
export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // 1) Buscar dados do ranking para obter user_id e selected_booklet
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

    // 2) Buscar dados consolidados por concurso
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .maybeSingle();

    console.log('[fetchExistingAnswers] Dados consolidados encontrados:', consolidatedData);
    console.log('[fetchExistingAnswers] Erro na busca consolidada:', consolidatedError);

    let answers: { [key: number]: string } = {};

    if (consolidatedData?.consolidated_data) {
      const data = consolidatedData.consolidated_data as any;
      console.log('[fetchExistingAnswers] Estrutura de dados consolidados:', data);

      // Buscar dados do usuário específico dentro do JSON consolidado
      const userData = data.users?.[rankingData.user_id];
      console.log('[fetchExistingAnswers] Dados do usuário no JSON consolidado:', userData);

      if (userData?.booklets) {
        // PRIORIDADE: selected_booklet do JSON consolidado (última edição salva)
        const consolidatedSelectedBooklet = userData.selected_booklet?.toString();
        
        // Fallback: selected_booklet do ranking
        const rankingSelectedBooklet = rankingData?.selected_booklet?.toString();
        
        // Determinar qual caderno usar: preferir o consolidado (última edição)
        let bookletIdToUse = null;
        
        if (consolidatedSelectedBooklet && userData.booklets[consolidatedSelectedBooklet]) {
          bookletIdToUse = consolidatedSelectedBooklet;
          console.log('[fetchExistingAnswers] Usando caderno do JSON consolidado:', bookletIdToUse);
        } else if (rankingSelectedBooklet && userData.booklets[rankingSelectedBooklet]) {
          bookletIdToUse = rankingSelectedBooklet;
          console.log('[fetchExistingAnswers] Usando caderno do ranking:', bookletIdToUse);
        } else {
          // Último fallback: primeiro caderno disponível
          bookletIdToUse = Object.keys(userData.booklets)[0];
          console.log('[fetchExistingAnswers] Usando primeiro caderno disponível:', bookletIdToUse);
        }

        if (bookletIdToUse) {
          const bookletAnswers = userData.booklets[bookletIdToUse]?.answers || {};
          Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
            const num = parseInt(questionNum);
            if (!isNaN(num) && typeof answer === 'string') {
              answers[num] = answer;
            }
          });
          console.log('[fetchExistingAnswers] Total de respostas carregadas:', Object.keys(answers).length);
        }
      }
    } else {
      console.log('[fetchExistingAnswers] Nenhum dado consolidado encontrado para o concurso');
    }

    console.log('[fetchExistingAnswers] Respostas finais para retorno:', answers);

    return {
      answers,
      discursiveScore: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.discursive ?? rankingData?.discursive_score ?? null,
      caseStudy1Score: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.case_study_1 ?? rankingData?.case_study_1_score ?? null,
      caseStudy2Score: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.case_study_2 ?? rankingData?.case_study_2_score ?? null,
      caseStudy3Score: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.case_study_3 ?? rankingData?.case_study_3_score ?? null,
      selectedBooklet: rankingData?.selected_booklet?.toString() || null,
      editCount: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.edit_count || 0,
      consolidatedData: consolidatedData?.consolidated_data,
    } as any;
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro ao buscar respostas consolidadas:', error);
    return {};
  }
};
