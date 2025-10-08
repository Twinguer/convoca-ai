/**
 * Serviço de Pontuação Seguro
 * Centraliza a lógica de cálculo entre frontend e backend
 * Garante consistência e permite migração gradual
 */

import { featureFlags, logFeatureUsage, getUserFeatureFlags } from '@/config/featureFlags';
import { scoreObjectiveAnswer, type ScoringInput, type ScoringOutput } from './scoring';
import { supabase } from '@/integrations/supabase/client';
import { securityMonitor } from './securityMonitor';

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
 * Calcula pontuação usando backend ou frontend baseado nas feature flags
 */
export const calculateSecureScore = async (
  input: SecureScoringInput
): Promise<SecureScoringOutput> => {
  const { userId, context, ...scoringInput } = input;
  
  // Verificar feature flags do usuário
  const userFlags = getUserFeatureFlags(userId);
  const useBackend = userFlags.useBackendScoring ?? featureFlags.useBackendScoring;
  
  if (useBackend) {
    return await calculateBackendScore(scoringInput, userId, context);
  } else {
    return calculateFrontendScore(scoringInput, context);
  }
};

/**
 * Calcula pontuação no frontend (lógica atual)
 */
const calculateFrontendScore = (
  input: ScoringInput,
  context?: string
): SecureScoringOutput => {
  const startTime = Date.now();
  logFeatureUsage('useBackendScoring', `frontend-${context || 'unknown'}`);
  
  try {
    const result = scoreObjectiveAnswer(input);
    
    const duration = Date.now() - startTime;
    securityMonitor.logPerformance('frontend_calculation', duration, 'frontend', context);
    
    return {
      ...result,
      source: 'frontend',
      timestamp: Date.now(),
    };
  } catch (error) {
    securityMonitor.logError(error as Error, `frontend-${context || 'unknown'}`);
    throw error;
  }
};

/**
 * Calcula pontuação no backend (nova implementação)
 */
const calculateBackendScore = async (
  input: ScoringInput,
  userId?: string,
  context?: string
): Promise<SecureScoringOutput> => {
  const startTime = Date.now();
  logFeatureUsage('useBackendScoring', `backend-${context || 'unknown'}`);
  
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
        console.error('[calculateBackendScore] Backend error:', error);
        return calculateFrontendScore(input, `fallback-${context || 'unknown'}`);
      }

      if (!data.success) {
        console.error('[calculateBackendScore] Validation failed:', data.error);
        securityMonitor.logValidationFailed(input, data.validation_errors || [], context);
        return calculateFrontendScore(input, `validation-fallback-${context || 'unknown'}`);
      }

      const scoringResult = data.scoring_result;
      const duration = Date.now() - startTime;
      securityMonitor.logPerformance('backend_calculation_secure', duration, 'backend', context);
      
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
        console.error('[calculateBackendScore] Backend error:', error);
        securityMonitor.logError(error as Error, `backend-${context || 'unknown'}`);
        return calculateFrontendScore(input, `fallback-${context || 'unknown'}`);
      }

      const duration = Date.now() - startTime;
      securityMonitor.logPerformance('backend_calculation_basic', duration, 'backend', context);

      return {
        totalDelta: data.total_delta || 0,
        disciplineDelta: data.discipline_delta || 0,
        weightedDisciplineDelta: data.weighted_discipline_delta || 0,
        source: 'backend',
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    console.error('[calculateBackendScore] Unexpected error:', error);
    securityMonitor.logError(error as Error, `backend-${context || 'unknown'}`);
    // Fallback para frontend em caso de erro
    return calculateFrontendScore(input, `error-fallback-${context || 'unknown'}`);
  }
};

/**
 * Compara resultados frontend vs backend para validação
 */
export const compareScoringResults = (
  frontend: SecureScoringOutput,
  backend: SecureScoringOutput
): {
  match: boolean;
  differences: {
    totalDelta: number;
    disciplineDelta: number;
    weightedDisciplineDelta: number;
  };
} => {
  const tolerance = 0.001; // Tolerância para diferenças de ponto flutuante
  
  const totalDiff = Math.abs(frontend.totalDelta - backend.totalDelta);
  const disciplineDiff = Math.abs(frontend.disciplineDelta - backend.disciplineDelta);
  const weightedDiff = Math.abs(frontend.weightedDisciplineDelta - backend.weightedDisciplineDelta);
  
  const match = totalDiff < tolerance && disciplineDiff < tolerance && weightedDiff < tolerance;
  
  return {
    match,
    differences: {
      totalDelta: totalDiff,
      disciplineDelta: disciplineDiff,
      weightedDisciplineDelta: weightedDiff,
    },
  };
};

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
  // Forçar cálculo em ambos para comparação
  const frontend = calculateFrontendScore(input, 'validation');
  const backend = await calculateBackendScore(input, input.userId, 'validation');
  
  const comparison = compareScoringResults(frontend, backend);
  
  if (!comparison.match) {
    securityMonitor.logDiscrepancy(frontend, backend, input, 'validation');
    console.warn('[validateScoring] Score mismatch detected:', {
      input,
      frontend,
      backend,
      differences: comparison.differences,
    });
  }
  
  return {
    valid: comparison.match,
    frontend,
    backend,
    comparison,
  };
};
