import type { CalendarProvider } from './CalendarProvider';
import LocalProvider from './LocalProvider';

const providers = new Map<string, CalendarProvider>();
const defaultProvider: CalendarProvider = LocalProvider;

export function registerProvider(name: string, provider: CalendarProvider): void {
  providers.set(name, provider);
}

export function getProvider(name: string): CalendarProvider {
  return providers.get(name) ?? defaultProvider;
}

export function clearProviders(): void {
  providers.clear();
}
