import { supabase } from '@/integrations/supabase/client';

// Busca gabarito oficial usando a ESTRUTURA ANTIGA (official_answer_weights)
export const fetchOfficialAnswersLegacy = async (concursoId: string) => {
  try {
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .maybeSingle();

    if (error) {
      console.error('[fetchOfficialAnswersLegacy] Erro ao buscar gabarito oficial:', error);
      return null;
    }

    if (!data?.consolidated_answer_data) {
      return null;
    }

    // Extrair dados do gabarito consolidado
    const consolidatedData = data.consolidated_answer_data;
    const booklets = consolidatedData.booklets || {};
    
    // Converter para o formato esperado pelo AnswerSheet
    const officialAnswers: { [bookletId: string]: { [questionNumber: number]: string } } = {};
    
    Object.entries(booklets).forEach(([bookletId, bookletData]: [string, any]) => {
      const answers: { [questionNumber: number]: string } = {};
      
      if (bookletData.answers) {
        Object.entries(bookletData.answers).forEach(([questionNum, answerData]: [string, any]) => {
          const questionNumber = parseInt(questionNum);
          if (!isNaN(questionNumber) && answerData.correct_answer) {
            answers[questionNumber] = answerData.correct_answer;
          }
        });
      }
      
      officialAnswers[bookletId] = answers;
    });

    return {
      officialAnswers,
      metadata: consolidatedData.metadata || {},
      booklets: Object.keys(booklets)
    };
  } catch (error) {
    console.error('[fetchOfficialAnswersLegacy] Erro ao buscar gabarito oficial:', error);
    return null;
  }
};

