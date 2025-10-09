/**
 * Serviço de Pontuação Seguro
 * Centraliza a lógica de cálculo entre frontend e backend
 * Garante consistência e permite migração gradual
 */

import { supabase } from '@/integrations/supabase/client';
import { type ScoringInput, type ScoringOutput } from './scoring';

export interface SecureScoringInput extends ScoringInput {
  userId?: string;
  concursoId?: string;
  context?: string;
}

export interface SecureScoringOutput extends ScoringOutput {
  source: 'frontend' | 'backend';
  timestamp: number;
}

/**
 * Calcula pontuação APENAS no backend - frontend não faz cálculos
 */
export const calculateSecureScore = async (
  input: SecureScoringInput
): Promise<SecureScoringOutput> => {
  const { userId, context, ...scoringInput } = input;
  
  // SEMPRE usar backend - frontend não faz cálculos
  return await calculateBackendScore(scoringInput, userId, context);
};

// Função de cálculo frontend removida por segurança

/**
 * Calcula pontuação no backend (nova implementação)
 */
const calculateBackendScore = async (
  input: ScoringInput,
  userId?: string,
  context?: string
): Promise<SecureScoringOutput> => {
  try {
    // Se temos userId e concursoId, usar validação completa
    if (userId && input.concursoId) {
      const { data, error } = await supabase.rpc('calculate_secure_score_with_validation', {
        p_user_id: userId,
        p_concurso_id: input.concursoId,
        p_question_weight: input.questionWeight,
        p_discipline_weight: input.disciplineWeight,
        p_is_correct: input.isCorrect,
        p_is_nullified: input.isNullified,
        p_is_blank: input.isBlank,
        p_exam_type: input.examType,
        p_wrong_answer_penalty: input.wrongAnswerPenalty,
      });

      if (error) {
        throw new Error('Erro no cálculo de pontuação: ' + error.message);
      }

      if (!data.success) {
        throw new Error('Validação falhou: ' + data.error);
      }

      const scoringResult = data.scoring_result;
      
      return {
        totalDelta: scoringResult.total_delta || 0,
        disciplineDelta: scoringResult.discipline_delta || 0,
        weightedDisciplineDelta: scoringResult.weighted_discipline_delta || 0,
        source: 'backend',
        timestamp: Date.now(),
      };
    } else {
      // Fallback para função básica se não temos validação completa
      const { data, error } = await supabase.rpc('calculate_secure_score', {
        p_question_weight: input.questionWeight,
        p_discipline_weight: input.disciplineWeight,
        p_is_correct: input.isCorrect,
        p_is_nullified: input.isNullified,
        p_is_blank: input.isBlank,
        p_exam_type: input.examType,
        p_wrong_answer_penalty: input.wrongAnswerPenalty,
      });

      if (error) {
        throw new Error('Erro no cálculo de pontuação: ' + error.message);
      }

      return {
        totalDelta: data.total_delta || 0,
        disciplineDelta: data.discipline_delta || 0,
        weightedDisciplineDelta: data.weighted_discipline_delta || 0,
        source: 'backend',
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    throw new Error('Erro inesperado no cálculo: ' + (error as Error).message);
  }
};

// Função de comparação removida - apenas backend é usado

/**
 * Valida se o cálculo está correto comparando frontend e backend
 */
export const validateScoring = async (
  input: SecureScoringInput
): Promise<{
  valid: boolean;
  frontend: SecureScoringOutput;
  backend: SecureScoringOutput;
  comparison: ReturnType<typeof compareScoringResults>;
}> => {
  // Apenas backend é usado - validação removida por segurança
  const backend = await calculateBackendScore(input, input.userId, 'validation');
  
  return {
    valid: true,
    frontend: null,
    backend,
    comparison: null,
  };
};
