
import { supabase } from '@/integrations/supabase/client';

// Busca respostas existentes usando a NOVA estrutura consolidada por concurso
// Retorna também as notas subjetivas e o caderno selecionado
export const fetchExistingAnswers = async (rankingId: string) => {
  try {
    // Log removido por segurança

    // 1) Buscar dados do ranking para obter user_id e selected_booklet
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_ranking_new')
      .select('user_answers, calculated_scores, metadata, ranking_id, user_id')
      .eq('id', rankingId)
      .maybeSingle();

    if (rankingError || !rankingData) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      return {};
    }

    // Log removido por segurança

    // 2) Extrair dados da nova estrutura JSONB
    const userAnswers = rankingData.user_answers || {};
    const calculatedScores = rankingData.calculated_scores || {};
    const metadata = rankingData.metadata || {};

    // Converter user_answers para o formato esperado
    let answers: { [key: number]: string } = {};
    Object.entries(userAnswers).forEach(([questionNum, answer]) => {
      const num = parseInt(questionNum);
      if (!isNaN(num) && typeof answer === 'string') {
        answers[num] = answer;
      }
    });

    // Log removido por segurança

    return {
      answers,
      discursiveScore: calculatedScores.discursive_score || null,
      caseStudy1Score: calculatedScores.case_study_1_score || null,
      caseStudy2Score: calculatedScores.case_study_2_score || null,
      caseStudy3Score: calculatedScores.case_study_3_score || null,
      selectedBooklet: metadata.selected_booklet?.toString() || null,
      editCount: metadata.edit_count || 0,
      consolidatedData: null, // Não usado na nova estrutura
    } as any;
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro ao buscar respostas consolidadas:', error);
    return {};
  }
};
