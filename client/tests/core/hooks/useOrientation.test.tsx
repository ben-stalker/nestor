import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock apiFetch — each test can set resolved value via mockApiFetch
const mockApiFetch = vi.fn();
vi.mock('../../../src/api/client', () => ({ default: mockApiFetch }));

// Import after mocks
async function importHook() {
  const mod = await import('../../../src/core/hooks/useOrientation');
  return mod.useOrientation;
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function makeMq(isPortrait: boolean) {
  return vi.fn((query: string) => {
    const matches = query === '(orientation: portrait)' ? isPortrait : !isPortrait;
    return {
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });
}

describe('useOrientation', () => {
  beforeEach(() => {
    vi.resetModules();
    mockApiFetch.mockResolvedValue({});
  });

  it('returns portrait when media is portrait and setting is auto', async () => {
    Object.defineProperty(window, 'matchMedia', { value: makeMq(true), writable: true });
    mockApiFetch.mockResolvedValue({ orientation: 'auto' });

    const useOrientation = await importHook();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useOrientation(), { wrapper: makeWrapper(qc) });

    expect(result.current).toBe('portrait');
  });

  it('returns landscape when media is landscape and setting is auto', async () => {
    Object.defineProperty(window, 'matchMedia', { value: makeMq(false), writable: true });
    mockApiFetch.mockResolvedValue({ orientation: 'auto' });

    const useOrientation = await importHook();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useOrientation(), { wrapper: makeWrapper(qc) });

    expect(result.current).toBe('landscape');
  });

  it('returns portrait when setting is portrait regardless of media', async () => {
    Object.defineProperty(window, 'matchMedia', { value: makeMq(false), writable: true });
    mockApiFetch.mockResolvedValue({ orientation: 'portrait' });

    const useOrientation = await importHook();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useOrientation(), { wrapper: makeWrapper(qc) });

    await waitFor(() => {
      expect(result.current).toBe('portrait');
    });
  });

  it('returns landscape when setting is landscape regardless of media', async () => {
    Object.defineProperty(window, 'matchMedia', { value: makeMq(true), writable: true });
    mockApiFetch.mockResolvedValue({ orientation: 'landscape' });

    const useOrientation = await importHook();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useOrientation(), { wrapper: makeWrapper(qc) });

    await waitFor(() => {
      expect(result.current).toBe('landscape');
    });
  });

  it('defaults to media query when settings data is absent', async () => {
    Object.defineProperty(window, 'matchMedia', { value: makeMq(true), writable: true });
    mockApiFetch.mockResolvedValue({});

    const useOrientation = await importHook();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useOrientation(), { wrapper: makeWrapper(qc) });

    expect(result.current).toBe('portrait');
  });

  it('updates when media query fires a change event', async () => {
    let changeHandler: (() => void) | undefined;
    const mockMq = {
      matches: true,
      media: '(orientation: portrait)',
      addEventListener: vi.fn((_: string, handler: () => void) => {
        changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => mockMq),
      writable: true,
    });
    mockApiFetch.mockResolvedValue({ orientation: 'auto' });

    const useOrientation = await importHook();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useOrientation(), { wrapper: makeWrapper(qc) });

    expect(result.current).toBe('portrait');

    // Simulate rotation to landscape
    mockMq.matches = false;
    act(() => {
      changeHandler?.();
    });

    expect(result.current).toBe('landscape');
  });
});
