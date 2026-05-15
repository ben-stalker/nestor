import type { TransportAdapter } from '../TransportAdapter';
import { defaultAdapter } from '../TransportAdapter';

const registry = new Map<string, TransportAdapter>();

/** Register a transport adapter by its providerId. */
export function registerAdapter(adapter: TransportAdapter): void {
  registry.set(adapter.providerId, adapter);
}

/** Unregister an adapter (used by plugins on teardown). */
export function unregisterAdapter(providerId: string): void {
  registry.delete(providerId);
}

/** Return registered adapters. Falls back to the built-in uk-no-op stub if none are registered. */
export function listAdapters(): TransportAdapter[] {
  if (registry.size === 0) return [defaultAdapter];
  return Array.from(registry.values());
}

/**
 * Return the active adapter. Plugins register by providerId; if no external adapter is
 * registered the built-in UK stub is used.
 */
export function getActiveAdapter(providerId?: string | null): TransportAdapter {
  if (providerId) {
    const found = registry.get(providerId);
    if (found) return found;
  }
  if (registry.size === 0) return defaultAdapter;
  return registry.values().next().value as TransportAdapter;
}
