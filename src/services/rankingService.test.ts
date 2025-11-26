// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
// ✅ FASE 4: Atualizado para usar serviço consolidado
import { fetchUserRankings } from './rankingService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  },
}));

describe('fetchUserRankings', () => {
  it('should fetch user rankings successfully', async () => {
    const mockData = [{
      id: '1',
      userId: 'user1',
      score: 100,
      position: 1,
      name: 'Usuário Anônimo',
      reservationType: 'Ampla Concorrência',
      avatarUrl: null,
      discursiveScore: 0,
      caseStudy1Score: 0,
      caseStudy2Score: 0,
      caseStudy3Score: 0,
      weightedDiscursiveScore: 0,
      weightedCaseStudy1Score: 0,
      weightedCaseStudy2Score: 0,
      weightedCaseStudy3Score: 0,
      customDisciplineScores: {},
      weightedCustomDisciplineScores: {},
      displayReservation: '',
      belowMinimum: false,
      belowBlockMinimums: undefined,
      belowDisciplineMinimums: undefined,
    }];
    supabase.from().select().eq().order.mockResolvedValue({ data: [{ ...mockData[0], user_id: 'user1' }], error: null });

    const result = await fetchUserRankings('concurso1');
    expect(result).toEqual(mockData);
  });

  it('should return an empty array if there is an error', async () => {
    supabase.from().select().eq().order.mockResolvedValue({ data: null, error: 'Error fetching data' });

    const result = await fetchUserRankings('concurso1');
    expect(result).toEqual([]);
  });
});
