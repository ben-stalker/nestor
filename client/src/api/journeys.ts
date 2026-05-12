import apiFetch from './client';

export type TransportMode = 'transit' | 'drive' | 'walk' | 'cycle';

export interface Journey {
  id: number;
  profile_id: number;
  label: string;
  origin: string;
  destination: string;
  transport_mode: TransportMode;
  days_active: number;
  provider_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface JourneyEta {
  journeyId: number;
  label: string;
  origin: string;
  destination: string;
  transportMode: string;
  etaMinutes: number | null;
  updatedAt: number;
}

export async function getJourneys(profileId: number): Promise<Journey[]> {
  return apiFetch<Journey[]>(`/api/v1/journeys?profile_id=${profileId}`);
}

export async function getJourneyEtas(profileId: number): Promise<JourneyEta[]> {
  return apiFetch<JourneyEta[]>(`/api/v1/journeys/eta?profile_id=${profileId}`);
}

export async function createJourney(
  data: Omit<Journey, 'id' | 'created_at' | 'updated_at'>,
): Promise<Journey> {
  return apiFetch<Journey>('/api/v1/journeys', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateJourney(
  id: number,
  data: Partial<Omit<Journey, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>,
): Promise<Journey> {
  return apiFetch<Journey>(`/api/v1/journeys/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteJourney(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/journeys/${id}`, { method: 'DELETE' });
}
