import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MessageBoard from '../../src/board/MessageBoard';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ lastMessage: null, readyState: 1, send: vi.fn() })),
}));

const mockMessages = [
  {
    id: 1,
    profile_id: 1,
    content: 'Hello household!',
    pinned: false,
    archived: false,
    created_at: Date.now() - 5000,
  },
  {
    id: 2,
    profile_id: 2,
    content: 'Pinned note',
    pinned: true,
    archived: false,
    created_at: Date.now() - 60000,
  },
];

const mockFetchMessages = vi.fn<() => Promise<unknown>>().mockResolvedValue(mockMessages);
const mockCreateMessage = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ id: 3, content: 'New msg', pinned: false, archived: false, created_at: Date.now() });
const mockArchiveMessage = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ ...mockMessages[0], archived: true });
const mockUpdateMessage = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(mockMessages[0]);

vi.mock('../../src/board/api', () => ({
  fetchMessages: () => mockFetchMessages(),
  createMessage: (...args: unknown[]) => mockCreateMessage(...args),
  archiveMessage: (...args: unknown[]) => mockArchiveMessage(...args),
  updateMessage: (...args: unknown[]) => mockUpdateMessage(...args),
  deleteMessage: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: 1, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderBoard() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MessageBoard />
    </QueryClientProvider>,
  );
}

describe('MessageBoard', () => {
  it('shows loading state initially', () => {
    mockFetchMessages.mockReturnValueOnce(new Promise(() => {}));
    renderBoard();
    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
  });

  it('renders messages after loading', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('Hello household!')).toBeInTheDocument();
      expect(screen.getByText('Pinned note')).toBeInTheDocument();
    });
  });

  it('shows pinned section for pinned messages', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });
  });

  it('shows empty state when no messages', async () => {
    mockFetchMessages.mockResolvedValueOnce([]);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
  });

  it('opens compose modal when Post button clicked', async () => {
    renderBoard();
    await waitFor(() => screen.getByText('Hello household!'));
    await userEvent.click(screen.getByRole('button', { name: /\+ post/i }));
    expect(screen.getByText('New Message')).toBeInTheDocument();
  });

  it('renders message cards with data-testid', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getAllByTestId('message-card').length).toBe(2);
    });
  });

  it('shows dismiss and pin buttons on each message', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getAllByText('Dismiss').length).toBe(2);
    });
  });
});
