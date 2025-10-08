import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import RankingTable from './RankingTable';

beforeAll(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
});

const mockRankings = [
  { position: 1, name: 'User 1', score: 100 },
  { position: 2, name: 'User 2', score: 90 },
];

describe('RankingTable', () => {
  it('should render rankings table with data', () => {
    render(<RankingTable rankings={mockRankings} isRefetching={false} />);

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('should display loading state when refetching', () => {
    render(<RankingTable rankings={mockRankings} isRefetching={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
