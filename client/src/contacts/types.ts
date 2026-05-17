export const CONTACT_CATEGORIES = [
  'medical',
  'school',
  'pets',
  'home_services',
  'emergency',
  'family',
  'trade',
  'other',
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ContactCategory, string> = {
  medical: 'Medical',
  school: 'School',
  pets: 'Pets',
  home_services: 'Home Services',
  emergency: 'Emergency',
  family: 'Family',
  trade: 'Tradespeople',
  other: 'Other',
};

export const CATEGORY_COLOURS: Record<ContactCategory, string> = {
  medical: '#ef4444',
  school: '#3b82f6',
  pets: '#f97316',
  home_services: '#10b981',
  emergency: '#dc2626',
  family: '#8b5cf6',
  trade: '#f59e0b',
  other: '#6b7280',
};

export interface Contact {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: ContactCategory;
  notes: string | null;
  linked_pet_id: number | null;
  linked_vehicle_id: number | null;
  created_at: number;
}

export interface ContactInput {
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category: ContactCategory;
  notes?: string | null;
  linked_pet_id?: number | null;
  linked_vehicle_id?: number | null;
}
