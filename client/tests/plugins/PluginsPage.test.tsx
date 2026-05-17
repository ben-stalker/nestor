import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiFetch from '../../src/api/client';
import PluginsPage from '../../src/plugins/PluginsPage';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

const mockFetch = vi.mocked(apiFetch);

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <PluginsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PluginsPage', () => {
  it('renders a list of installed plugins', async () => {
    mockFetch.mockImplementation((path: string) => {
      if (path === '/api/v1/plugins') {
        return Promise.resolve([
          {
            id: 'tesla',
            name: 'Tesla',
            version: '0.1.0',
            author: 'Nestor',
            description: 'Battery and charging',
            capabilities: ['home_screen_widget'],
            settingsFields: [],
            apiRisk: 'unofficial',
            status: 'disabled',
          },
        ]);
      }
      return Promise.resolve([]);
    });
    renderPage();
    expect(await screen.findByText('Tesla')).toBeInTheDocument();
    expect(screen.getByTestId('risk-badge-unofficial')).toBeInTheDocument();
  });

  it('shows enable button when disabled', async () => {
    mockFetch.mockImplementation((path: string) => {
      if (path === '/api/v1/plugins') {
        return Promise.resolve([
          {
            id: 'tesla',
            name: 'Tesla',
            version: '0.1.0',
            author: 'Nestor',
            description: '',
            capabilities: [],
            settingsFields: [],
            apiRisk: 'official',
            status: 'disabled',
          },
        ]);
      }
      return Promise.resolve(null);
    });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Enable' })).toBeInTheDocument();
  });

  it('toggling Browse Community shows configuration hint when not set', async () => {
    mockFetch.mockImplementation((path: string) => {
      if (path === '/api/v1/plugins') return Promise.resolve([]);
      if (path === '/api/v1/plugins/community') {
        return Promise.resolve({ configured: false, plugins: [] });
      }
      return Promise.resolve(null);
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Browse Community' }));
    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
  });

  it('shows Restart button only for errored plugins', async () => {
    mockFetch.mockImplementation((path: string) => {
      if (path === '/api/v1/plugins') {
        return Promise.resolve([
          {
            id: 'broken',
            name: 'Broken',
            version: '0.1.0',
            author: 'X',
            description: '',
            capabilities: [],
            settingsFields: [],
            apiRisk: 'community',
            status: 'error',
            errorMessage: 'kaboom',
          },
        ]);
      }
      return Promise.resolve(null);
    });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Restart' })).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  it('community tab shows confirm prompt before install', async () => {
    mockFetch.mockImplementation((path: string) => {
      if (path === '/api/v1/plugins') return Promise.resolve([]);
      if (path === '/api/v1/plugins/community') {
        return Promise.resolve({
          configured: true,
          plugins: [
            {
              id: 'cool',
              name: 'Cool',
              description: 'A neat plugin',
              author: 'Someone',
              apiRisk: 'community',
            },
          ],
        });
      }
      return Promise.resolve(null);
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Browse Community' }));
    await waitFor(() => expect(screen.getByTestId('community-row-cool')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(await screen.findByText(/review code before enabling/i)).toBeInTheDocument();
  });
});
