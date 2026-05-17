import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardPage from '../../src/board/BoardPage';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/board/api', () => ({
  fetchMessages: vi.fn().mockResolvedValue([]),
  createMessage: vi.fn(),
  updateMessage: vi.fn(),
  archiveMessage: vi.fn(),
  deleteMessage: vi.fn(),
  fetchCountdowns: vi.fn().mockResolvedValue([]),
  createCountdown: vi.fn(),
  updateCountdown: vi.fn(),
  deleteCountdown: vi.fn(),
  fetchSnapshots: vi.fn().mockResolvedValue([]),
  saveSnapshot: vi.fn(),
  renameSnapshot: vi.fn(),
  deleteSnapshot: vi.fn(),
  fetchLists: vi.fn().mockResolvedValue([]),
  fetchList: vi.fn().mockResolvedValue({ id: 1, name: 'Test', type: 'one_off', items: [] }),
  createList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
  createListItem: vi.fn(),
  updateListItem: vi.fn(),
  deleteListItem: vi.fn(),
  resetList: vi.fn(),
  fetchGuestChecklists: vi.fn().mockResolvedValue([]),
  fetchGuestChecklist: vi
    .fn()
    .mockResolvedValue({ id: 1, name: 'Guest', guest_name: 'X', items: [] }),
  createGuestChecklist: vi.fn(),
  updateGuestChecklist: vi.fn(),
  deleteGuestChecklist: vi.fn(),
  createGuestItem: vi.fn(),
  updateGuestItem: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

vi.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ lastMessage: null, readyState: 1, send: vi.fn() })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <BoardPage />
    </QueryClientProvider>,
  );
}

describe('BoardPage', () => {
  it('renders board page with tabs', () => {
    renderPage();
    expect(screen.getByTestId('board-page')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Whiteboard' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Countdowns' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Lists' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Guest Visits' })).toBeInTheDocument();
  });

  it('shows messages tab by default', () => {
    renderPage();
    const messagesTab = screen.getByRole('tab', { name: 'Messages' });
    expect(messagesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Countdowns tab when clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Countdowns' }));
    expect(screen.getByRole('tab', { name: 'Countdowns' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() => expect(screen.getByText(/no countdowns/i)).toBeInTheDocument());
  });

  it('switches to Whiteboard tab when clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Whiteboard' }));
    expect(screen.getByRole('tab', { name: 'Whiteboard' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('switches to Lists tab when clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Lists' }));
    expect(screen.getByRole('tab', { name: 'Lists' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Guest Visits tab when clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Guest Visits' }));
    expect(screen.getByRole('tab', { name: 'Guest Visits' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
