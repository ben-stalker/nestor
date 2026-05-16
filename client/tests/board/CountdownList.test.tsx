import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CountdownList from '../../src/board/CountdownList';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const mockCountdowns = [
  {
    id: 1,
    name: 'Christmas',
    target_date: new Date('2027-12-25').getTime(),
    show_on_home: true,
    savings_goal_id: null,
    created_at: Date.now(),
  },
  {
    id: 2,
    name: 'Holiday',
    target_date: Date.now() + 3 * 24 * 60 * 60 * 1000,
    show_on_home: false,
    savings_goal_id: null,
    created_at: Date.now(),
  },
];

const mockFetchCountdowns = vi.fn().mockResolvedValue(mockCountdowns);
const mockCreateCountdown = vi.fn().mockResolvedValue({ id: 3, name: 'New' });
const mockDeleteCountdown = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/board/api', () => ({
  fetchCountdowns: () => mockFetchCountdowns(),
  createCountdown: (...args: unknown[]) => mockCreateCountdown(...args),
  updateCountdown: vi.fn().mockResolvedValue({}),
  deleteCountdown: (...args: unknown[]) => mockDeleteCountdown(...args),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: 1 })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderCountdowns() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <CountdownList />
    </QueryClientProvider>,
  );
}

describe('CountdownList', () => {
  it('shows loading state initially', () => {
    mockFetchCountdowns.mockReturnValueOnce(new Promise(() => {}));
    renderCountdowns();
    expect(screen.getByText(/loading countdowns/i)).toBeInTheDocument();
  });

  it('renders countdown list after loading', async () => {
    renderCountdowns();
    await waitFor(() => {
      expect(screen.getByText('Christmas')).toBeInTheDocument();
      expect(screen.getByText('Holiday')).toBeInTheDocument();
    });
  });

  it('shows Home badge for show_on_home countdowns', async () => {
    renderCountdowns();
    await waitFor(() => {
      expect(screen.getByText(/Home/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no countdowns', async () => {
    mockFetchCountdowns.mockResolvedValueOnce([]);
    renderCountdowns();
    await waitFor(() => {
      expect(screen.getByText(/no countdowns/i)).toBeInTheDocument();
    });
  });

  it('opens form modal when Add button clicked', async () => {
    renderCountdowns();
    await waitFor(() => screen.getByText('Christmas'));
    await userEvent.click(screen.getByRole('button', { name: /\+ add/i }));
    expect(screen.getByText('New Countdown')).toBeInTheDocument();
  });

  it('shows day chips on countdowns', async () => {
    renderCountdowns();
    await waitFor(() => {
      expect(screen.getByText('Holiday')).toBeInTheDocument();
      expect(screen.getByText('3d')).toBeInTheDocument();
    });
  });
});
