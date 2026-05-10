import apiFetch from './client';

export type ProfileType = 'baby' | 'toddler' | 'child' | 'teen' | 'grandparent' | 'guest' | 'admin';
export type TextSize = 'small' | 'default' | 'large' | 'xlarge';

export interface Profile {
  id: number;
  name: string;
  type: ProfileType;
  colour: string;
  avatar_path: string | null;
  pinSet: boolean;
  text_size: TextSize;
  simplified_nav: number;
  created_at: number;
}

export async function getProfiles(): Promise<Profile[]> {
  return apiFetch<Profile[]>('/api/v1/profiles');
}

export async function verifyPin(id: number, pin: string): Promise<{ valid: boolean }> {
  return apiFetch<{ valid: boolean }>(`/api/v1/profiles/${id}/verify-pin`, {
    method: 'POST',
    body: { pin },
  });
}
