import { describe, expect, it, vi, beforeEach } from 'vitest';

const maybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle,
          })),
        })),
      })),
    })),
  },
}));

import { checkIsPlatformAdmin } from '@/utils/adminRole';

describe('checkIsPlatformAdmin', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  it('retorna true quando há role admin', async () => {
    maybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });
    await expect(checkIsPlatformAdmin('user-1')).resolves.toBe(true);
  });

  it('retorna false quando não há role', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(checkIsPlatformAdmin('user-1')).resolves.toBe(false);
  });
});
