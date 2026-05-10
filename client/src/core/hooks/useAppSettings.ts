import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../api/client';

export interface AppSettings {
  orientation?: 'auto' | 'portrait' | 'landscape';
  [key: string]: unknown;
}

export const APP_SETTINGS_KEY = ['app-settings'] as const;

export function useAppSettings() {
  return useQuery<AppSettings>({
    queryKey: APP_SETTINGS_KEY,
    queryFn: () => apiFetch<AppSettings>('/api/v1/settings'),
    staleTime: 60_000,
  });
}
