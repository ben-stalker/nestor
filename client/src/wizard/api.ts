import apiFetch from '../api/client';

export async function patchSettings(patch: Record<string, unknown>): Promise<void> {
  await apiFetch<void>('/api/v1/settings', { method: 'PATCH', body: patch });
}

export async function completeSetup(): Promise<void> {
  await apiFetch<void>('/api/v1/settings', { method: 'PATCH', body: { setup_complete: true } });
}
