import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from '../../src/core/AppShell';

// Mock useWebSocket to avoid real WS connections
vi.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ lastMessage: null, readyState: 1, send: vi.fn() })),
}));

// Mock apiFetch to control settings
vi.mock('../../src/api/client', () => ({
  default: vi.fn(() => Promise.resolve({})),
}));

// Mock alert hooks so BadgeCountsSyncer doesn't interfere with query invalidation assertions
vi.mock('../../src/hooks/useAlerts', () => ({
  useBadgeCounts: vi.fn(() => ({ data: undefined })),
  useMarkRead: vi.fn(() => ({ mutate: vi.fn() })),
}));

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderShell(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="*" element={<main>page content</main>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn((query: string) => ({
      matches: query === '(orientation: portrait)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
  });

  it('renders children via Outlet', () => {
    renderShell(makeQueryClient());
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('applies portrait class when media is portrait', () => {
    renderShell(makeQueryClient());
    const shell = document.querySelector('.app-shell');
    expect(shell).toHaveClass('app-shell--portrait');
    expect(shell).toHaveAttribute('data-orientation', 'portrait');
  });

  it('applies landscape class when media is landscape', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    renderShell(makeQueryClient());
    const shell = document.querySelector('.app-shell');
    expect(shell).toHaveClass('app-shell--landscape');
    expect(shell).toHaveAttribute('data-orientation', 'landscape');
  });

  it('invalidates app-settings query on settings:updated WS message', async () => {
    const { useWebSocket } = await import('../../src/hooks/useWebSocket');
    const mockUseWebSocket = vi.mocked(useWebSocket);
    const queryClient = makeQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    // Start with no message
    mockUseWebSocket.mockReturnValue({ lastMessage: null, readyState: 1, send: vi.fn() });
    renderShell(queryClient);

    // Simulate settings:updated message
    mockUseWebSocket.mockReturnValue({
      lastMessage: { event: 'settings:updated', payload: { keys: ['orientation'] } },
      readyState: 1,
      send: vi.fn(),
    });

    act(() => {
      renderShell(queryClient);
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['app-settings'] });
  });

  it('does not invalidate on non-settings WS messages', async () => {
    const { useWebSocket } = await import('../../src/hooks/useWebSocket');
    const mockUseWebSocket = vi.mocked(useWebSocket);
    const queryClient = makeQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    mockUseWebSocket.mockReturnValue({
      lastMessage: { event: 'alert:new', payload: {} },
      readyState: 1,
      send: vi.fn(),
    });

    renderShell(queryClient);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
