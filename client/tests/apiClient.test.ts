import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAppStore from '../src/store/appStore';

// import after store so module ordering is correct
const { default: apiFetch } = await import('../src/api/client');

function mockFetch(body: unknown, status = 200, contentType = 'application/json') {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response;
  vi.spyOn(global, 'fetch').mockResolvedValueOnce(res);
}

beforeEach(() => {
  useAppStore.setState({ activeProfileId: null, adminPin: null });
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('sends JSON body with Content-Type header', async () => {
    mockFetch({ ok: true });
    await apiFetch('/api/test', { method: 'POST', body: { key: 'value' } });
    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify({ key: 'value' }));
  });

  it('does not set X-Profile-Id when no active profile', async () => {
    mockFetch({});
    await apiFetch('/api/test');
    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('X-Profile-Id')).toBeNull();
  });

  it('sets X-Profile-Id and X-Admin-Pin from store', async () => {
    useAppStore.setState({ activeProfileId: 'abc', adminPin: '9999' });
    mockFetch({});
    await apiFetch('/api/test');
    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('X-Profile-Id')).toBe('abc');
    expect(headers.get('X-Admin-Pin')).toBe('9999');
  });

  it('throws on non-ok response', async () => {
    mockFetch('Not found', 404, 'text/plain');
    await expect(apiFetch('/api/test')).rejects.toThrow('API error 404');
  });

  it('returns parsed JSON on success', async () => {
    mockFetch({ items: [1, 2, 3] });
    const result = await apiFetch<{ items: number[] }>('/api/test');
    expect(result.items).toEqual([1, 2, 3]);
  });
});
