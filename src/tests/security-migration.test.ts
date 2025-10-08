/**
 * Testes para Migração de Segurança
 * Compara resultados frontend vs backend para garantir consistência
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  calculateSecureScore, 
  validateScoring, 
  compareScoringResults,
  type SecureScoringInput 
} from '@/services/secureScoring';
import { updateFeatureFlags } from '@/config/featureFlags';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('Security Migration Tests', () => {
  // Helper para configurar mock do Supabase
  const setupSupabaseMock = async (mockData: any) => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    });
    return supabase;
  };

  beforeEach(async () => {
    // Reset feature flags para cada teste
    updateFeatureFlags({
      useBackendScoring: false,
      useBackendValidation: false,
      enableSecurityLogging: true,
    });
    
    // Reset mock do Supabase
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.rpc).mockReset();
  });

  describe('Feature Flag Behavior', () => {
    it('should use frontend when backend is disabled', async () => {
      updateFeatureFlags({ useBackendScoring: false });
      
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 1,
        isCorrect: true,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0,
        context: 'test-frontend-only',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.source).toBe('frontend');
      expect(result.totalDelta).toBe(1);
    });

    it('should use backend when enabled', async () => {
      updateFeatureFlags({ useBackendScoring: true });
      
      // Mock específico para este teste
      await setupSupabaseMock({
        total_delta: 1,
        discipline_delta: 1,
        weighted_discipline_delta: 1,
      });
      
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 1,
        isCorrect: true,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0,
        context: 'test-backend-only',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.source).toBe('backend');
    });
  });

  describe('Error Handling', () => {
    it('should fallback to frontend when backend fails', async () => {
      updateFeatureFlags({ useBackendScoring: true });
      
      // Mock backend error
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Backend error'));
      
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 1,
        isCorrect: true,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0,
        context: 'test-error-fallback',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.source).toBe('frontend');
      expect(result.totalDelta).toBe(1);
    });
  });

  describe('Comparison Logic', () => {
    it('should detect differences between frontend and backend', () => {
      const frontend = {
        totalDelta: 1.0,
        disciplineDelta: 1,
        weightedDisciplineDelta: 2.0,
        source: 'frontend' as const,
        timestamp: Date.now(),
      };

      const backend = {
        totalDelta: 1.1,
        disciplineDelta: 1,
        weightedDisciplineDelta: 2.2,
        source: 'backend' as const,
        timestamp: Date.now(),
      };

      const comparison = compareScoringResults(frontend, backend);
      
      expect(comparison.match).toBe(false);
      expect(comparison.differences.totalDelta).toBeCloseTo(0.1, 5);
      expect(comparison.differences.weightedDisciplineDelta).toBeCloseTo(0.2, 5);
    });

    it('should match when results are identical', () => {
      const frontend = {
        totalDelta: 1.0,
        disciplineDelta: 1,
        weightedDisciplineDelta: 2.0,
        source: 'frontend' as const,
        timestamp: Date.now(),
      };

      const backend = {
        totalDelta: 1.0,
        disciplineDelta: 1,
        weightedDisciplineDelta: 2.0,
        source: 'backend' as const,
        timestamp: Date.now(),
      };

      const comparison = compareScoringResults(frontend, backend);
      
      expect(comparison.match).toBe(true);
      expect(comparison.differences.totalDelta).toBe(0);
    });
  });

  describe('Frontend Scoring Logic', () => {
    it('should calculate correct scores for correct answers', async () => {
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: true,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0,
        context: 'test-correct',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.totalDelta).toBe(1);
      expect(result.disciplineDelta).toBe(1);
      expect(result.weightedDisciplineDelta).toBe(2);
    });

    it('should calculate correct scores for nullified questions', async () => {
      const input: SecureScoringInput = {
        questionWeight: 1.5,
        disciplineWeight: 3,
        isCorrect: false,
        isNullified: true,
        isBlank: false,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0,
        context: 'test-nullified',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.totalDelta).toBe(1.5);
      expect(result.disciplineDelta).toBe(1);
      expect(result.weightedDisciplineDelta).toBe(4.5);
    });

    it('should calculate correct scores for blank answers', async () => {
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: true,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0,
        context: 'test-blank',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.totalDelta).toBe(0);
      expect(result.disciplineDelta).toBe(0);
      expect(result.weightedDisciplineDelta).toBe(0);
    });

    it('should calculate correct scores for "Certo ou Errado" with penalty', async () => {
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: false,
        examType: 'Certo ou Errado',
        wrongAnswerPenalty: 0.5,
        context: 'test-penalty',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.totalDelta).toBe(-0.5);
      expect(result.disciplineDelta).toBe(0);
      expect(result.weightedDisciplineDelta).toBe(-1);
    });

    it('should calculate correct scores for "Certo ou Errado" without penalty', async () => {
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: false,
        examType: 'Certo ou Errado',
        wrongAnswerPenalty: 0,
        context: 'test-no-penalty',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.totalDelta).toBe(0);
      expect(result.disciplineDelta).toBe(0);
      expect(result.weightedDisciplineDelta).toBe(0);
    });

    it('should calculate correct scores for "Múltipla Escolha" wrong answers', async () => {
      const input: SecureScoringInput = {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha',
        wrongAnswerPenalty: 0.5,
        context: 'test-multiple-choice',
      };

      const result = await calculateSecureScore(input);
      
      expect(result.totalDelta).toBe(0);
      expect(result.disciplineDelta).toBe(0);
      expect(result.weightedDisciplineDelta).toBe(0);
    });
  });
});