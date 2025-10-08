import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import RankingsTab from './RankingsTab';

beforeAll(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
});

const mockUserRankings = [
  { position: 1, name: 'User 1', score: 100 },
  { position: 2, name: 'User 2', score: 90 },
];

describe('RankingsTab', () => {
  it('should render user rankings', () => {
    render(<RankingsTab userId="user1" userRankings={mockUserRankings} isAuthenticated={true} />);

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('should display a message when no rankings are available', () => {
    render(<RankingsTab userId="user1" userRankings={[]} isAuthenticated={true} />);

    expect(screen.getByText('No rankings available')).toBeInTheDocument();
  });
});
