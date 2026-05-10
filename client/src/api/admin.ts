import apiFetch from './client';

export async function activateKioskLock(profileId: string, adminPin: string): Promise<void> {
  await apiFetch<void>('/api/v1/admin/kiosk-lock', {
    method: 'POST',
    body: { profileId },
    headers: { 'X-Admin-Pin': adminPin },
  });
}

export async function unlockKiosk(pin: string): Promise<{ valid: boolean }> {
  return apiFetch<{ valid: boolean }>('/api/v1/admin/kiosk-unlock', {
    method: 'POST',
    body: { pin },
  });
}

export async function verifyAdminPin(pin: string): Promise<{ valid: boolean }> {
  return apiFetch<{ valid: boolean }>('/api/v1/admin/verify-pin', {
    method: 'POST',
    body: { pin },
  });
}

export async function triggerDpmsOff(): Promise<void> {
  await apiFetch<void>('/api/v1/admin/dpms-off', { method: 'POST' });
}

export async function setBrightness(level: number): Promise<void> {
  await apiFetch<void>('/api/v1/admin/brightness', {
    method: 'POST',
    body: { level },
  });
}
