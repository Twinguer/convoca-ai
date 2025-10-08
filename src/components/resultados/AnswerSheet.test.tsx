import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnswerSheet } from './AnswerSheet';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';

// Create a query client instance
const queryClient = new QueryClient();

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { selected_booklet: 'booklet-1' } }),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Test suite for AnswerSheet
describe('AnswerSheet Component', () => {
  const mockConcurso = { id: 'concurso-1' };
  const mockRankingId = 'ranking-1';
  const mockOnSuccess = vi.fn();

  it('should render without crashing', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AnswerSheet concurso={mockConcurso} rankingId={mockRankingId} onSuccess={mockOnSuccess} />
        </QueryClientProvider>
      );
    });
    expect(await screen.findByText('Caderno de Respostas')).toBeInTheDocument();
  });

  it('should allow switching booklets', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AnswerSheet concurso={mockConcurso} rankingId={mockRankingId} onSuccess={mockOnSuccess} />
        </QueryClientProvider>
      );
    });
    const switchButton = await screen.findByRole('button', { name: /trocar caderno/i });
    fireEvent.click(switchButton);
    expect(await screen.findByText('Caderno alterado para')).toBeInTheDocument();
  });

  it('should save answers correctly', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AnswerSheet concurso={mockConcurso} rankingId={mockRankingId} onSuccess={mockOnSuccess} />
        </QueryClientProvider>
      );
    });
    const saveButton = await screen.findByRole('button', { name: /salvar respostas/i });
    fireEvent.click(saveButton);
    expect(await screen.findByText('Respostas salvas com sucesso')).toBeInTheDocument();
  });
});
