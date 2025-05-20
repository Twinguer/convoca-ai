
import { supabase } from '@/integrations/supabase/client';

interface RecalculationResponse {
  success: boolean;
  message?: string;
  error?: any;
}

type PositionThreshold = 'ampla' | 'cota_racial' | 'pcd';

const isPositionThreshold = (value: string): value is PositionThreshold => {
  return ['ampla', 'cota_racial', 'pcd'].includes(value);
};

export const recalculateUserScore = async (userId: string, concursoId: string): Promise<RecalculationResponse> => {
  try {
    // Obter dados do concurso para aplicar regras específicas
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar dados do concurso:', concursoError);
      return { 
        success: false, 
        message: 'Erro ao obter dados do concurso', 
        error: concursoError 
      };
    }

    // Se o concurso exige pontuação mínima verificamos isso
    let minimumScoreRequired = 0;
    
    // Verificar se tem score mínimo e buscar o valor corretamente
    if (concurso?.has_minimum_score === true) {
      // Usar acesso seguro à propriedade para evitar erro TypeScript
      minimumScoreRequired = typeof concurso?.total_minimum_score === 'number' 
        ? concurso.total_minimum_score 
        : parseInt(String(concurso?.total_minimum_score || '0'), 10);
        
      console.log(`Pontuação mínima requerida: ${minimumScoreRequired}`);
    }

    // Obter as respostas do usuário
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('question_number, answer')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId);

    if (userAnswersError) {
      console.error('Erro ao buscar respostas do usuário:', userAnswersError);
      return { 
        success: false, 
        message: 'Erro ao obter respostas do usuário', 
        error: userAnswersError 
      };
    }

    // Obter os pesos das respostas corretas
    const { data: officialAnswers, error: officialAnswersError } = await supabase
      .from('official_answer_weights')
      .select('question_number, correct_answer, weight, is_nullified')
      .eq('concurso_id', concursoId);

    if (officialAnswersError) {
      console.error('Erro ao buscar pesos das respostas corretas:', officialAnswersError);
      return { 
        success: false, 
        message: 'Erro ao obter pesos das respostas corretas', 
        error: officialAnswersError 
      };
    }

    let totalScore = 0;
    let totalWeight = 0;

    // Calcular a pontuação do usuário
    for (const userAnswer of userAnswers || []) {
      const officialAnswer = officialAnswers?.find(oa => oa.question_number === userAnswer.question_number);

      if (officialAnswer) {
        const isCorrect = officialAnswer.correct_answer === userAnswer.answer || officialAnswer.is_nullified === true;

        if (isCorrect) {
          totalScore += officialAnswer.weight || 1;
        }
        totalWeight += officialAnswer.weight || 1;
      }
    }

    // Atualizar a pontuação do usuário no ranking
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({ score: totalScore })
      .eq('user_id', userId)
      .eq('concurso_id', concursoId);

    if (updateError) {
      console.error('Erro ao atualizar pontuação do usuário:', updateError);
      return { 
        success: false, 
        message: 'Erro ao atualizar pontuação do usuário', 
        error: updateError 
      };
    }
    
    // Verificar se o usuário atingiu a pontuação mínima
    if (minimumScoreRequired > 0 && totalScore < minimumScoreRequired) {
      // Atualizar o status do usuário para "eliminado"
      const { error: updateStatusError } = await supabase
        .from('user_rankings')
        .update({ status: 'eliminado' })
        .eq('user_id', userId)
        .eq('concurso_id', concursoId);
        
      if (updateStatusError) {
        console.error('Erro ao atualizar status do usuário:', updateStatusError);
        return { 
          success: false, 
          message: 'Erro ao atualizar status do usuário', 
          error: updateStatusError 
        };
      }
    } else {
      // Se o usuário atingiu a pontuação mínima, atualizar o status para "classificado"
      const { error: updateStatusError } = await supabase
        .from('user_rankings')
        .update({ status: 'classificado' })
        .eq('user_id', userId)
        .eq('concurso_id', concursoId);
        
      if (updateStatusError) {
        console.error('Erro ao atualizar status do usuário:', updateStatusError);
        return { 
          success: false, 
          message: 'Erro ao atualizar status do usuário', 
          error: updateStatusError 
        };
      }
    }

    return { success: true, message: 'Pontuação recalculada com sucesso' };
  } catch (error) {
    console.error('Erro ao recalcular pontuação:', error);
    return { 
      success: false, 
      message: 'Erro ao recalcular pontuação', 
      error: error 
    };
  }
};

export const getUserRankingPosition = async (
  userId: string,
  concursoId: string,
  cota?: string
): Promise<number | null> => {
  try {
    let query = supabase
      .from('user_rankings')
      .select('position')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId);

    if (cota && isPositionThreshold(cota)) {
      query = query.eq('cota', cota);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar posição do usuário:', error);
      return null;
    }

    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('vagas')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar número de vagas:', concursoError);
      return null;
    }

    const vacanciesCount = concurso?.vagas;

    // Corrigir a expressão com o operador > para verificar as posições
    // Verificamos valores válidos antes da comparação
    if (cota && isPositionThreshold(cota) && 
        typeof data?.[0]?.position === 'number' && 
        typeof vacanciesCount === 'number' && 
        data[0].position > vacanciesCount) {
      return null;
    }

    return data?.[0]?.position || null;
  } catch (error) {
    console.error('Erro ao obter posição do usuário:', error);
    return null;
  }
};
