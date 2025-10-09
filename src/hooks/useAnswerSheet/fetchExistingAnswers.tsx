
import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    // Log removido por segurança

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

    // Log removido por segurança

    // Buscar dados consolidados por concurso (NOVA ESTRUTURA)
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .maybeSingle();

    console.log('[fetchExistingAnswers] Dados consolidados encontrados:', consolidatedData);
    console.log('[fetchExistingAnswers] Erro na busca consolidada:', consolidatedError);

    let answers: { [key: number]: string } = {};

    if (consolidatedData?.consolidated_data) {
      const data = consolidatedData.consolidated_data;
      console.log('[fetchExistingAnswers] Estrutura de dados consolidados:', data);
      
      // Buscar dados do usuário específico
      const userData = data.users?.[rankingData.user_id];
      console.log('[fetchExistingAnswers] Dados do usuário no JSON consolidado:', userData);
      
      if (userData?.booklets && rankingData?.selected_booklet) {
        const selectedBookletId = rankingData.selected_booklet.toString();
        // Logs removidos por segurança
        
        const bookletAnswers = userData.booklets[selectedBookletId]?.answers || {};

        // Converter para formato esperado (número da questão como chave)
        Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
          answers[parseInt(questionNum)] = answer as string;
        });
        
        console.log('[fetchExistingAnswers] Answers convertidas:', answers);
      } else if (userData?.booklets) {
        // Fallback: usar primeiro caderno disponível se nenhum selecionado
        const bookletIds = Object.keys(userData.booklets);
        if (bookletIds.length > 0) {
          const firstBookletId = bookletIds[0];
          // Log removido por segurança
          
          const bookletAnswers = userData.booklets[firstBookletId]?.answers || {};
          Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
            answers[parseInt(questionNum)] = answer as string;
          });
        }
      } else {
        console.log('[fetchExistingAnswers] Nenhum caderno encontrado para o usuário');
        // Log removido por segurança
        // Log removido por segurança
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
      consolidatedData: consolidatedData?.consolidated_data
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro ao buscar respostas consolidadas:', error);
    return {};
  }
};
