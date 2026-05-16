import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GuestVisitTab from '../../src/board/GuestVisitTab';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const mockGuests = [
  {
    id: 1,
    name: 'Mum visit',
    type: 'one_off',
    guest_name: 'Mum',
    guest_arrival_date: Date.now() + 5 * 24 * 60 * 60 * 1000,
    auto_reset_cron: null,
    template_id: null,
    last_reset_at: null,
    created_at: Date.now(),
    items: [],
  },
];

const mockFetchGuestChecklists = vi.fn().mockResolvedValue(mockGuests);
const mockFetchGuestChecklist = vi.fn().mockResolvedValue({
  ...mockGuests[0],
  items: [{ id: 1, checklist_id: 1, text: 'Fresh towels', ticked: false, sort_order: 0, section: null }],
});

vi.mock('../../src/board/api', () => ({
  fetchGuestChecklists: () => mockFetchGuestChecklists(),
  fetchGuestChecklist: () => mockFetchGuestChecklist(),
  createGuestChecklist: vi.fn().mockResolvedValue({ id: 2, guest_name: 'Dad', items: [] }),
  updateGuestChecklist: vi.fn().mockResolvedValue({}),
  deleteGuestChecklist: vi.fn().mockResolvedValue(undefined),
  createGuestItem: vi.fn().mockResolvedValue({ id: 10, text: 'New item', ticked: false }),
  updateGuestItem: vi.fn().mockResolvedValue({ id: 1, ticked: true }),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: 1 })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderGuests() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <GuestVisitTab />
    </QueryClientProvider>,
  );
}

describe('GuestVisitTab', () => {
  it('shows loading state initially', () => {
    mockFetchGuestChecklists.mockReturnValueOnce(new Promise(() => {}));
    renderGuests();
    expect(screen.getByText(/loading guest visits/i)).toBeInTheDocument();
  });

  it('renders guest list after loading', async () => {
    renderGuests();
    await waitFor(() => {
      expect(screen.getByText('Mum')).toBeInTheDocument();
      expect(screen.getByText('Mum visit')).toBeInTheDocument();
    });
  });

  it('shows empty state when no guests', async () => {
    mockFetchGuestChecklists.mockResolvedValueOnce([]);
    renderGuests();
    await waitFor(() => {
      expect(screen.getByText(/no guest visits/i)).toBeInTheDocument();
    });
  });

  it('opens new guest form when Add Guest clicked', async () => {
    renderGuests();
    await waitFor(() => screen.getByText('Mum'));
    await userEvent.click(screen.getByRole('button', { name: /\+ add guest/i }));
    expect(screen.getByText('New Guest Visit')).toBeInTheDocument();
  });

  it('navigates to guest detail when guest clicked', async () => {
    renderGuests();
    await waitFor(() => screen.getByText('Mum'));
    await userEvent.click(screen.getByText('Mum visit'));
    await waitFor(() => {
      expect(screen.getByText('Fresh towels')).toBeInTheDocument();
    });
  });

  it('shows Back button in guest detail', async () => {
    renderGuests();
    await waitFor(() => screen.getByText('Mum'));
    await userEvent.click(screen.getByText('Mum visit'));
    await waitFor(() => {
      expect(screen.getByText(/← back to guest visits/i)).toBeInTheDocument();
    });
  });
});
