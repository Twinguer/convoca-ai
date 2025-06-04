
import { supabase } from '../client';

// Interface para a nova estrutura JSON consolidada
interface ConsolidatedAnswers {
  booklets: {
    [bookletId: string]: {
      answers: { [questionNumber: string]: string };
      metadata: {
        completed_at: string;
        answer_count: number;
      };
    };
  };
  subjective_scores: {
    discursive: number;
    case_study_1: number;
    case_study_2: number;
    case_study_3: number;
  };
  selected_booklet: string;
  total_edit_count: number;
  metadata: {
    last_updated: string;
    version: string;
  };
}

// Função para buscar as respostas consolidadas
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    console.log('[fetchUserAnswers] Fetching consolidated answers for ranking ID:', rankingId);

    // Buscar dados consolidados usando nova estrutura
    const { data, error } = await supabase
      .from('user_answers')
      .select('answers_data')
      .eq('user_ranking_id', rankingId)
      .is('question_number', null)
      .single();
      
    if (error) {
      console.error('[fetchUserAnswers] Error:', error);
      return {};
    }

    if (!data?.answers_data) {
      console.log('[fetchUserAnswers] No consolidated data found');
      return {};
    }

    const consolidatedData = data.answers_data as ConsolidatedAnswers;
    console.log('[fetchUserAnswers] Retrieved consolidated data:', consolidatedData);

    // Extrair respostas de todos os cadernos para compatibilidade
    const answers: { [key: number]: string } = {};
    
    if (consolidatedData.booklets) {
      Object.values(consolidatedData.booklets).forEach(booklet => {
        if (booklet.answers) {
          Object.entries(booklet.answers).forEach(([questionNum, answer]) => {
            answers[parseInt(questionNum)] = answer;
          });
        }
      });
    }

    return {
      answers,
      discursiveScore: consolidatedData.subjective_scores?.discursive || null,
      caseStudy1Score: consolidatedData.subjective_scores?.case_study_1 || null,
      caseStudy2Score: consolidatedData.subjective_scores?.case_study_2 || null,
      caseStudy3Score: consolidatedData.subjective_scores?.case_study_3 || null,
      selectedBooklet: consolidatedData.selected_booklet || null,
      editCount: consolidatedData.total_edit_count || 0,
      consolidatedData // Retornar dados completos para uso avançado
    };
  } catch (error) {
    console.error('[fetchUserAnswers] Erro ao buscar respostas consolidadas:', error);
    return {};
  }
};

// Função para buscar respostas de um caderno específico
export const fetchUserAnswersForBooklet = async (rankingId: string, bookletId: string) => {
  try {
    const result = await fetchUserAnswers(rankingId);
    
    if (result.consolidatedData?.booklets?.[bookletId]) {
      return result.consolidatedData.booklets[bookletId].answers;
    }
    
    return {};
  } catch (error) {
    console.error('[fetchUserAnswersForBooklet] Erro:', error);
    return {};
  }
};

// Função legada mantida para compatibilidade - agora redireciona para consolidatedAnswerService
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge?: boolean }[]
) => {
  console.log('[saveUserAnswers] Função legada redirecionando para RPC consolidada...');
  // Esta função agora apenas redireciona - a real implementação está no useSaveAnswers.tsx
  return true;
};

// Re-exporta a função de recálculo em lote para manter compatibilidade
export { recalculateAllUserScores } from './batchOperations';
