import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../api/client';

export interface AppSettings {
  orientation?: 'auto' | 'portrait' | 'landscape';
  enabled_nav_modes?: string[];
  nav_layout?: 'single' | 'double' | 'scrollable' | 'hamburger';
  kiosk_lock?: string | null;
  idle_dim_seconds?: number;
  idle_sleep_seconds?: number;
  idle_dim_level?: number;
  night_mode_enabled?: boolean;
  night_mode_start?: string;
  night_mode_end?: string;
  night_mode_dim_level?: number;
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
