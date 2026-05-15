import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue([]),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/family/api', () => ({
  getChores: vi.fn().mockResolvedValue([]),
  completeChore: vi.fn().mockResolvedValue({ id: 1, points_awarded: 2 }),
  getRewardGrid: vi.fn().mockResolvedValue({ filled: 3, total: 10, totalEarned: 3, streak: 2 }),
}));

const MePage = (await import('../../src/me/MePage')).default;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const CHILD_PROFILE = {
  id: 1,
  name: 'Alice',
  type: 'child' as const,
  colour: '#4caf50',
  avatar_path: null,
  pinSet: false,
  text_size: 'default' as const,
  simplified_nav: 1,
  created_at: 1000,
};

const TODDLER_PROFILE = { ...CHILD_PROFILE, id: 2, name: 'Toby', type: 'toddler' as const };

describe('MePage', () => {
  it('renders child profile with greeting and chores section', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={makeQC()}>
          <MePage profile={CHILD_PROFILE} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.getByText(/my chores/i)).toBeInTheDocument();
    expect(screen.getByText(/my stars/i)).toBeInTheDocument();
  });

  it('renders ToddlerView for toddler profile', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={makeQC()}>
          <MePage profile={TODDLER_PROFILE} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/Toby's view/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no chores', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={makeQC()}>
          <MePage profile={CHILD_PROFILE} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/no chores today/i)).toBeInTheDocument();
    });
  });
});
