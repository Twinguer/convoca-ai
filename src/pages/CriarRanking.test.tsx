import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import CriarRanking from './CriarRanking';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth to return a user
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user1', name: 'Test User' } }),
}));

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));

beforeAll(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
});

describe('CriarRanking', () => {
  it('should render the ranking creation form', () => {
    render(
      <BrowserRouter>
        <CriarRanking />
      </BrowserRouter>
    );

    expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
    expect(screen.getByText('Gabarito Oficial')).toBeInTheDocument();
  });

  it('should switch tabs when clicking on tab triggers', () => {
    render(
      <BrowserRouter>
        <CriarRanking />
      </BrowserRouter>
    );

    const generalInfoTab = screen.getByText('Informações Gerais');
    const answerKeyTab = screen.getByText('Gabarito Oficial');

    fireEvent.click(answerKeyTab);
    expect(answerKeyTab).toHaveClass('active');
    expect(generalInfoTab).not.toHaveClass('active');

    fireEvent.click(generalInfoTab);
    expect(generalInfoTab).toHaveClass('active');
    expect(answerKeyTab).not.toHaveClass('active');
  });
});
