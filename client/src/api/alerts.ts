import apiFetch from './client';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface Alert {
  id: number;
  type: string;
  severity: AlertSeverity;
  message: string;
  deep_link: string | null;
  profile_id: number | null;
  dismissed: boolean;
  dismissed_at: number | null;
  created_at: number;
}

export async function getAlerts(): Promise<Alert[]> {
  return apiFetch<Alert[]>('/api/v1/alerts');
}

export async function dismissAlert(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/alerts/${id}/dismiss`, { method: 'POST' });
}
