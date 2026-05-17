import apiFetch from './client';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface Alert {
  id: number;
  type: string;
  severity: AlertSeverity;
  message: string;
  deep_link: string | null;
  profile_id: number | null;
  nav_mode_badge: string | null;
  dismissed: boolean;
  dismissed_at: number | null;
  read_at: number | null;
  created_at: number;
}

export interface BadgeCount {
  count: number;
  severity: AlertSeverity;
}

export async function getAlerts(): Promise<Alert[]> {
  return apiFetch<Alert[]>('/api/v1/alerts');
}

export async function dismissAlert(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/alerts/${id}/dismiss`, { method: 'POST' });
}

export async function getBadgeCounts(): Promise<Record<string, BadgeCount>> {
  return apiFetch<Record<string, BadgeCount>>('/api/v1/alerts/badge-counts');
}

export async function markRead(navMode: string): Promise<void> {
  await apiFetch<void>(`/api/v1/alerts/mark-read?navMode=${encodeURIComponent(navMode)}`, {
    method: 'POST',
  });
}
