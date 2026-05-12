import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../../src/features/home';

vi.mock('../../../src/api/client', () => ({
  default: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/lines-between-class-members
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../../src/api/profiles', () => ({ getProfiles: vi.fn() }));
vi.mock('../../../src/api/weather', () => ({ getWeather: vi.fn() }));
vi.mock('../../../src/core/applyProfileSettings', () => ({ applyProfileSettings: vi.fn() }));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('renders the main home page element', () => {
    renderPage();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders the home header', () => {
    renderPage();
    expect(screen.getByTestId('home-header')).toBeInTheDocument();
  });

  it('renders all placeholder sections', () => {
    renderPage();
    expect(screen.getByTestId('placeholder-alerts')).toBeInTheDocument();
    expect(screen.getByTestId('placeholder-day-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('placeholder-journey-widget')).toBeInTheDocument();
    expect(screen.getByTestId('placeholder-plugin-strip')).toBeInTheDocument();
  });
});
