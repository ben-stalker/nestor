export interface PendingDeviceCode {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresAt: number;
  interval: number;
}

const store = new Map<string, PendingDeviceCode>();

const cleanup = setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.expiresAt <= now) store.delete(key);
  });
}, 60_000);
cleanup.unref();

export function storePendingCode(entry: PendingDeviceCode): void {
  store.set(entry.deviceCode, entry);
}

export function getPendingCode(deviceCode: string): PendingDeviceCode | undefined {
  const entry = store.get(deviceCode);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(deviceCode);
    return undefined;
  }
  return entry;
}

export function removePendingCode(deviceCode: string): void {
  store.delete(deviceCode);
}

export function clearAll(): void {
  store.clear();
}
