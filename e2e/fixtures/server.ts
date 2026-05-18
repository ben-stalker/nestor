/**
 * Server helpers for E2E tests.
 *
 * Provides utilities for interacting with the test server:
 * - waitForServer: polls until the server is ready
 * - API helpers for seeding state via REST
 */

const BASE_URL = 'http://localhost:3000';

export async function waitForServer(timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/settings`);
      if (res.ok || res.status === 401) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

export async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} returned ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} returned ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
