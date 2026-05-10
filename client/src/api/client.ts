import useAppStore from '../store/appStore';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { activeProfileId, adminPin } = useAppStore.getState();

  const headers = new Headers(options.headers as HeadersInit);
  headers.set('Content-Type', 'application/json');

  if (activeProfileId) {
    headers.set('X-Profile-Id', activeProfileId);
  }
  if (adminPin) {
    headers.set('X-Admin-Pin', adminPin);
  }

  const res = await fetch(path, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, `API error ${res.status}: ${text}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return res.text() as unknown as T;
}

export default apiFetch;
