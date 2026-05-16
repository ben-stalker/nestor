import apiFetch from '../api/client';
import useAppStore from '../store/appStore';
import type { Pet, PetInput, PetHealthLog, PetHealthLogInput, UpcomingCareItem } from './types';

// ─── Pets ────────────────────────────────────────────────────────────────────

export function listPets(): Promise<Pet[]> {
  return apiFetch<Pet[]>('/api/v1/pets');
}

export function createPet(input: PetInput): Promise<Pet> {
  return apiFetch<Pet>('/api/v1/pets', { method: 'POST', body: input });
}

export function updatePet(id: number, input: Partial<PetInput>): Promise<Pet> {
  return apiFetch<Pet>(`/api/v1/pets/${id}`, { method: 'PATCH', body: input });
}

export function deletePet(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/pets/${id}`, { method: 'DELETE' });
}

export async function uploadPetPhoto(petId: number, file: File): Promise<{ photo_path: string }> {
  const { activeProfileId, adminPin } = useAppStore.getState();
  const formData = new FormData();
  formData.append('photo', file);

  const headers = new Headers();
  if (activeProfileId) headers.set('X-Profile-Id', activeProfileId);
  if (adminPin) headers.set('X-Admin-Pin', adminPin);

  const res = await fetch(`/api/v1/pets/${petId}/photo`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${text}`);
  }
  return res.json() as Promise<{ photo_path: string }>;
}

// ─── Health Logs ─────────────────────────────────────────────────────────────

export function listHealthLogs(petId: number): Promise<PetHealthLog[]> {
  return apiFetch<PetHealthLog[]>(`/api/v1/pets/${petId}/health-log`);
}

export function createHealthLog(petId: number, input: PetHealthLogInput): Promise<PetHealthLog> {
  return apiFetch<PetHealthLog>(`/api/v1/pets/${petId}/health-log`, {
    method: 'POST',
    body: input,
  });
}

export function updateHealthLog(
  petId: number,
  logId: number,
  input: Partial<PetHealthLogInput>,
): Promise<PetHealthLog> {
  return apiFetch<PetHealthLog>(`/api/v1/pets/${petId}/health-log/${logId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteHealthLog(petId: number, logId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/pets/${petId}/health-log/${logId}`, { method: 'DELETE' });
}

export async function uploadDocument(
  petId: number,
  logId: number,
  file: File,
): Promise<{ document_path: string; document_name: string }> {
  const { activeProfileId, adminPin } = useAppStore.getState();
  const formData = new FormData();
  formData.append('document', file);

  const headers = new Headers();
  if (activeProfileId) headers.set('X-Profile-Id', activeProfileId);
  if (adminPin) headers.set('X-Admin-Pin', adminPin);

  const res = await fetch(`/api/v1/pets/${petId}/health-log/${logId}/document`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${text}`);
  }
  return res.json() as Promise<{ document_path: string; document_name: string }>;
}

export function getUpcomingCare(days = 30): Promise<UpcomingCareItem[]> {
  return apiFetch<UpcomingCareItem[]>(`/api/v1/pets/upcoming-care?days=${days}`);
}
