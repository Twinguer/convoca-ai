
import { supabase } from '@/integrations/supabase/client';
import { consolidatedAnswerService } from '@/services/consolidatedAnswerService';

export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas para ranking:', rankingId);

    // Primeiro, buscar informações do user_ranking para obter o caderno selecionado
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('id', rankingId)
      .single();

    if (rankingError) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    console.log('[fetchExistingAnswers] Dados do ranking:', rankingData);

    // Buscar dados consolidados
    const consolidatedData = await consolidatedAnswerService.getConsolidatedAnswers(rankingId);
    console.log('[fetchExistingAnswers] Dados consolidados:', consolidatedData);

    let answers: { [key: number]: string } = {};

    if (consolidatedData && rankingData?.selected_booklet) {
      // Buscar respostas APENAS do caderno selecionado
      const selectedBookletId = rankingData.selected_booklet;
      console.log('[fetchExistingAnswers] Caderno selecionado:', selectedBookletId);
      
      if (consolidatedData.booklets?.[selectedBookletId]) {
        const bookletAnswers = consolidatedData.booklets[selectedBookletId].answers || {};
        console.log('[fetchExistingAnswers] Respostas do caderno selecionado:', bookletAnswers);

        // Converter para formato esperado
        Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
          answers[parseInt(questionNum)] = answer;
        });
      } else {
        console.log('[fetchExistingAnswers] Nenhuma resposta encontrada para o caderno selecionado:', selectedBookletId);
      }
    } else if (consolidatedData?.booklets) {
      // Fallback: se não há caderno selecionado, pegar do primeiro caderno disponível
      const firstBookletId = Object.keys(consolidatedData.booklets)[0];
      if (firstBookletId) {
        console.log('[fetchExistingAnswers] Fallback: usando primeiro caderno disponível:', firstBookletId);
        const bookletAnswers = consolidatedData.booklets[firstBookletId].answers || {};
        
        Object.entries(bookletAnswers).forEach(([questionNum, answer]) => {
          answers[parseInt(questionNum)] = answer;
        });
      }
    }

    console.log('[fetchExistingAnswers] Respostas finais para o caderno atual:', answers);

    return {
      answers,
      discursiveScore: consolidatedData?.subjective_scores?.discursive ?? rankingData?.discursive_score ?? null,
      caseStudy1Score: consolidatedData?.subjective_scores?.case_study_1 ?? rankingData?.case_study_1_score ?? null,
      caseStudy2Score: consolidatedData?.subjective_scores?.case_study_2 ?? rankingData?.case_study_2_score ?? null,
      caseStudy3Score: consolidatedData?.subjective_scores?.case_study_3 ?? rankingData?.case_study_3_score ?? null,
      selectedBooklet: rankingData?.selected_booklet || null,
      editCount: consolidatedData?.total_edit_count || 0,
      consolidatedData
    };
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro ao buscar respostas consolidadas:', error);
    return {};
  }
};
