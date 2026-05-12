import apiFetch from './client';

export type ComingUpCategory = 'countdown' | 'finance' | 'vehicle' | 'birthday' | 'holiday';

export interface ComingUpItem {
  id: string;
  title: string;
  daysUntil: number;
  category: ComingUpCategory;
  deepLink?: string;
}

export interface ComingUpResponse {
  items: ComingUpItem[];
}

export async function getComingUp(): Promise<ComingUpResponse> {
  return apiFetch<ComingUpResponse>('/api/v1/home/coming-up');
}
