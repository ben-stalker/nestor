import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/family/api', () => ({
  getFamilySummary: vi.fn().mockResolvedValue([]),
  getChores: vi.fn().mockResolvedValue([]),
  getRewardGrid: vi.fn().mockResolvedValue({ filled: 0, total: 10, totalEarned: 0, streak: 0 }),
  getHealthLog: vi.fn().mockResolvedValue([]),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const FamilyHub = (await import('../../src/family/FamilyHub')).default;

describe('FamilyHub', () => {
  it('shows empty state when no children', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <FamilyHub />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/no children yet/i)).toBeInTheDocument();
    });
  });

  it('renders child cards when data is present', async () => {
    const { getFamilySummary } = await import('../../src/family/api');
    vi.mocked(getFamilySummary).mockResolvedValueOnce([
      {
        profile: {
          id: 1,
          name: 'Bob',
          type: 'child',
          colour: '#f00',
          avatar_path: null,
          pinSet: false,
          text_size: 'default',
          simplified_nav: 0,
          created_at: 1000,
        },
        todayChores: 1,
        todayChoreTotal: 2,
        pointsBalance: 5,
        nextEvent: null,
      },
      {
        profile: {
          id: 2,
          name: 'Eve',
          type: 'toddler',
          colour: '#0f0',
          avatar_path: null,
          pinSet: false,
          text_size: 'default',
          simplified_nav: 0,
          created_at: 1000,
        },
        todayChores: 0,
        todayChoreTotal: 1,
        pointsBalance: 3,
        nextEvent: null,
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <FamilyHub />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Eve')).toBeInTheDocument();
    });
  });
});
