
import { supabase } from '@/integrations/supabase/client';

export const fetchExistingAnswers = async (
  rankingId: string,
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>,
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' }>>,
  setDiscursiveScore: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy1Score: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy2Score: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy3Score: React.Dispatch<React.SetStateAction<number | null>>
) => {
  try {
    console.log('[fetchExistingAnswers] Buscando respostas existentes para o ranking ID:', rankingId);
    
    // Fetch answers
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) {
      console.error('[fetchExistingAnswers] Erro ao buscar respostas:', answersError);
      throw answersError;
    }
    
    console.log('[fetchExistingAnswers] Dados de respostas obtidos:', answersData?.length || 0, 'respostas');
    
    if (answersData?.length) {
      const answersMap: { [key: number]: string } = {};
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' } = {};
      
      answersData.forEach((item: any) => {
        answersMap[item.question_number] = item.answer;
        
        if (item.is_basic_knowledge) {
          typesMap[item.question_number] = 'basic';
        } else if (item.is_specific_1) {
          typesMap[item.question_number] = 'specific1';
        } else if (item.is_specific_2) {
          typesMap[item.question_number] = 'specific2';
        } else if (item.is_specific_3) {
          typesMap[item.question_number] = 'specific3';
        }
      });
      
      console.log('[fetchExistingAnswers] Mapa de respostas criado:', Object.keys(answersMap).length, 'respostas');
      
      setAnswers(answersMap);
      setQuestionType(typesMap);
    } else {
      console.log('[fetchExistingAnswers] Nenhuma resposta encontrada para este ranking');
    }
    
    // Fetch user ranking for scores
    console.log('[fetchExistingAnswers] Buscando dados do ranking para pontuações subjetivas');
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
      
    if (rankingError) {
      console.error('[fetchExistingAnswers] Erro ao buscar dados do ranking:', rankingError);
      throw rankingError;
    }
    
    console.log('[fetchExistingAnswers] Dados do ranking obtidos:', rankingData);
    
    // Definir explicitamente todas as pontuações subjetivas com base nos dados do ranking
    if (rankingData) {
      console.log('[fetchExistingAnswers] Definindo pontuações subjetivas:',
        'Discursiva:', rankingData.discursive_score,
        'Estudo de Caso 1:', rankingData.case_study_1_score,
        'Estudo de Caso 2:', rankingData.case_study_2_score,
        'Estudo de Caso 3:', rankingData.case_study_3_score
      );
      
      setDiscursiveScore(rankingData.discursive_score);
      setCaseStudy1Score(rankingData.case_study_1_score);
      setCaseStudy2Score(rankingData.case_study_2_score);
      setCaseStudy3Score(rankingData.case_study_3_score);
    }
  } catch (error) {
    console.error('[fetchExistingAnswers] Erro não tratado:', error);
  }
};
