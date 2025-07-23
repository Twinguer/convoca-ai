
import { supabase } from '@/integrations/supabase/client';
import { consolidatedAnswerService } from '@/services/consolidatedAnswerService';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // Primeiro, buscar informações do user_ranking para obter o caderno selecionado
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('id', rankingId)
      .single();

    if (rankingError) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    console.log('[fetchExistingAnswers] Dados do ranking:', rankingData);

    // Buscar dados consolidados por concurso (NOVA ESTRUTURA)
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .single();

    console.log('[fetchExistingAnswers] Dados consolidados encontrados:', consolidatedData);
    console.log('[fetchExistingAnswers] Erro na busca consolidada:', consolidatedError);

    let answers: { [key: number]: string } = {};

    if (consolidatedData?.consolidated_data && rankingData?.selected_booklet) {
      // CORREÇÃO: Acessar consolidated_data corretamente
      const consolidatedAnswers = consolidatedData.consolidated_data;
      console.log('[fetchExistingAnswers] Estrutura de dados consolidados:', consolidatedAnswers);
      
      // Buscar dados do usuário específico
      const userData = consolidatedAnswers.users?.[rankingData.user_id];
      console.log('[fetchExistingAnswers] Dados do usuário:', userData);
      
      if (userData?.booklets) {
        const selectedBookletId = rankingData.selected_booklet.toString();
        console.log('[fetchExistingAnswers] Caderno selecionado:', selectedBookletId);
        
        const bookletAnswers = userData.booklets[selectedBookletId]?.answers || {};
        console.log('[fetchExistingAnswers] Respostas do caderno selecionado:', bookletAnswers);

        // Converter para formato esperado
        Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
          answers[parseInt(questionNum)] = answer as string;
        });
      } else {
        console.log('[fetchExistingAnswers] Nenhuma resposta encontrada para o usuário ou caderno');
        console.log('[fetchExistingAnswers] Booklets do usuário:', userData?.booklets);
      }
    } else if (consolidatedData?.consolidated_data) {
      // Fallback: se não há caderno selecionado, pegar do primeiro caderno disponível
      const consolidatedAnswers = consolidatedData.consolidated_data;
      const userData = consolidatedAnswers.users?.[rankingData.user_id];
      
      if (userData?.booklets) {
        const firstBookletId = Object.keys(userData.booklets)[0];
        if (firstBookletId) {
          console.log('[fetchExistingAnswers] Fallback: usando primeiro caderno disponível:', firstBookletId);
          const bookletAnswers = userData.booklets[firstBookletId].answers || {};
          
          Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
            answers[parseInt(questionNum)] = answer as string;
          });
        }
      }
    } else {
      console.log('[fetchExistingAnswers] Nenhum dado consolidado encontrado');
      console.log('[fetchExistingAnswers] consolidatedData:', consolidatedData);
    }

    console.log('[fetchExistingAnswers] Respostas finais para o caderno atual:', answers);

    return {
      answers,
      discursiveScore: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.discursive ?? rankingData?.discursive_score ?? null,
      caseStudy1Score: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.case_study_1 ?? rankingData?.case_study_1_score ?? null,
      caseStudy2Score: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.case_study_2 ?? rankingData?.case_study_2_score ?? null,
      caseStudy3Score: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.subjective_scores?.case_study_3 ?? rankingData?.case_study_3_score ?? null,
      selectedBooklet: rankingData?.selected_booklet || null,
      editCount: consolidatedData?.consolidated_data?.users?.[rankingData.user_id]?.edit_count || 0,
      consolidatedData: consolidatedData?.consolidated_data
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro ao buscar respostas consolidadas:', error);
    return {};
  }
};
