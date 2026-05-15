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
  getRewardGrid: vi.fn().mockResolvedValue({ filled: 7, total: 10, totalEarned: 17, streak: 3 }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const RewardStarGrid = (await import('../../src/me/RewardStarGrid')).default;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('RewardStarGrid', () => {
  it('renders correct number of filled and empty stars', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <RewardStarGrid profileId={1} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAccessibleName(/7 of 10 stars filled/i);
    });
  });

  it('shows streak indicator when streak > 0', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <RewardStarGrid profileId={1} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('day streak')).toBeInTheDocument();
    });
  });
});
