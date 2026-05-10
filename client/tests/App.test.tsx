import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';

vi.mock('../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ lastMessage: null, readyState: 1, send: vi.fn() })),
}));

vi.mock('../src/api/client', () => ({
  default: vi.fn(() => Promise.resolve({})),
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query === '(orientation: portrait)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders Nestor splash heading', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: 'Nestor' })).toBeInTheDocument();
  });

  it('renders tagline', () => {
    renderApp();
    expect(screen.getByText("Your family's home hub")).toBeInTheDocument();
  });
});
