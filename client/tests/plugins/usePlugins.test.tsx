import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import apiFetch from '../../src/api/client';
import {
  usePlugins,
  usePluginRegistries,
  usePluginWidgets,
  useCommunityPlugins,
} from '../../src/plugins/hooks/usePlugins';

vi.mock('../../src/api/client', () => ({ default: vi.fn(), ApiError: class extends Error {} }));

const mockFetch = vi.mocked(apiFetch);

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('usePlugins hooks', () => {
  it('usePlugins returns the plugin list', async () => {
    mockFetch.mockResolvedValue([{ id: 'a' }]);
    const { result } = renderHook(() => usePlugins(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual([{ id: 'a' }]);
  });

  it('usePluginRegistries fetches the snapshot', async () => {
    mockFetch.mockResolvedValue({
      widgets: [{ pluginId: 'a', id: 'w', title: 'W' }],
      navModes: [],
      sidebarFilters: [],
      voiceHandlers: [],
      calendarSystems: [],
    });
    const { result } = renderHook(() => usePluginRegistries(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.widgets).toHaveLength(1);
  });

  it('usePluginWidgets exposes widgets array', async () => {
    mockFetch.mockResolvedValue({
      widgets: [{ pluginId: 'a', id: 'w', title: 'W' }],
      navModes: [],
      sidebarFilters: [],
      voiceHandlers: [],
      calendarSystems: [],
    });
    const { result } = renderHook(() => usePluginWidgets(), { wrapper });
    await waitFor(() => expect(result.current.widgets).toHaveLength(1));
  });

  it('useCommunityPlugins returns the response', async () => {
    mockFetch.mockResolvedValue({ configured: true, plugins: [] });
    const { result } = renderHook(() => useCommunityPlugins(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.configured).toBe(true);
  });
});
