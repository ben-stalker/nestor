import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/house/api', () => ({
  getAdultChores: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/family/api', () => ({
  completeChore: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const AdultChoreRota = (await import('../../src/house/chores/AdultChoreRota')).default;

describe('AdultChoreRota', () => {
  it('renders empty state when no adult chores', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <AdultChoreRota />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No adult chores/i)).toBeInTheDocument();
    });
  });

  it('renders adult chores', async () => {
    const { getAdultChores } = await import('../../src/house/api');
    vi.mocked(getAdultChores).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Vacuum living room',
        description: null,
        assigned_profile_id: 1,
        points: 2,
        frequency: 'weekly',
        active: true,
        sort_order: 0,
        created_at: Date.now(),
      },
      {
        id: 2,
        name: 'Take out bins',
        description: 'Every Monday',
        assigned_profile_id: 2,
        points: 1,
        frequency: 'weekly',
        active: true,
        sort_order: 1,
        created_at: Date.now(),
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <AdultChoreRota />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Vacuum living room')).toBeInTheDocument();
      expect(screen.getByText('Take out bins')).toBeInTheDocument();
    });
  });

  it('renders Done buttons for each chore', async () => {
    const { getAdultChores } = await import('../../src/house/api');
    vi.mocked(getAdultChores).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Mop floors',
        description: null,
        assigned_profile_id: 1,
        points: 3,
        frequency: 'weekly',
        active: true,
        sort_order: 0,
        created_at: Date.now(),
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <AdultChoreRota />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Mop floors/i })).toBeInTheDocument();
    });
  });
});
