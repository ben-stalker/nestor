import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiFetch from '../../src/api/client';
import PluginSettingsModal from '../../src/plugins/components/PluginSettingsModal';
import type { PluginInfo } from '../../src/plugins/types';

vi.mock('../../src/api/client', () => ({ default: vi.fn(), ApiError: class extends Error {} }));

const mockFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const PLUGIN: PluginInfo = {
  id: 'tesla',
  name: 'Tesla',
  version: '0.1.0',
  author: 'Nestor',
  description: 'desc',
  capabilities: ['settings_panel'],
  settingsFields: [
    { key: 'access_token', label: 'Access token', type: 'password' },
    { key: 'low_battery_threshold', label: 'Threshold', type: 'number', default: 20 },
    { key: 'enable_alerts', label: 'Enable alerts', type: 'toggle', default: true },
  ],
  apiRisk: 'unofficial',
  status: 'disabled',
};

function renderModal(onClose = vi.fn()) {
  return render(
    <QueryClientProvider client={makeQC()}>
      <PluginSettingsModal plugin={PLUGIN} onClose={onClose} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

interface FetchCall {
  path: string;
  options?: { method?: string; body?: Record<string, unknown> };
}

describe('PluginSettingsModal', () => {
  it('renders all configured fields', async () => {
    mockFetch.mockResolvedValueOnce({});
    renderModal();
    await waitFor(() => expect(screen.getByLabelText('Access token')).toBeInTheDocument());
    expect(screen.getByLabelText('Threshold')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable alerts')).toBeInTheDocument();
  });

  it('saves typed values via PUT', async () => {
    mockFetch.mockResolvedValueOnce({});
    const onClose = vi.fn();
    renderModal(onClose);
    await waitFor(() => screen.getByLabelText('Access token'));
    fireEvent.change(screen.getByLabelText('Access token'), { target: { value: 'sekret' } });
    mockFetch.mockResolvedValueOnce(undefined);
    fireEvent.submit(screen.getByLabelText('Access token').closest('form') as HTMLFormElement);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const calls = mockFetch.mock.calls as unknown as [string, FetchCall['options']?][];
    const putCall = calls.find((c) => c[1]?.method === 'PUT');
    expect(putCall).toBeDefined();
    const body = putCall?.[1]?.body as { access_token: string };
    expect(body.access_token).toBe('sekret');
  });
});
