export const PET_SPECIES = ['dog', 'cat', 'rabbit', 'bird', 'fish', 'reptile', 'other'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_LOG_TYPES = [
  'vaccination',
  'flea_treatment',
  'worming',
  'weight',
  'medication',
  'vet_visit',
  'document',
  'other',
] as const;
export type PetLogType = (typeof PET_LOG_TYPES)[number];

export interface Pet {
  id: number;
  name: string;
  species: PetSpecies;
  breed: string | null;
  dob: string | null;
  colour: string | null;
  microchip: string | null;
  insurance_policy: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_address: string | null;
  vet_contact_id: number | null;
  feeding_notes: string | null;
  grooming_notes: string | null;
  photo_path: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface PetInput {
  name: string;
  species?: PetSpecies;
  breed?: string | null;
  dob?: string | null;
  colour?: string | null;
  microchip?: string | null;
  insurance_policy?: string | null;
  vet_name?: string | null;
  vet_phone?: string | null;
  vet_address?: string | null;
  vet_contact_id?: number | null;
  feeding_notes?: string | null;
  grooming_notes?: string | null;
}

export interface PetHealthLog {
  id: number;
  pet_id: number;
  log_type: PetLogType;
  title: string;
  notes: string | null;
  log_date: string;
  next_due_date: string | null;
  reminder_days_before: number | null;
  weight_kg: number | null;
  document_path: string | null;
  document_name: string | null;
  linked_calendar_event_id: number | null;
  created_at: number;
  updated_at: number;
}

export interface PetHealthLogInput {
  log_type: PetLogType;
  title: string;
  notes?: string | null;
  log_date: string;
  next_due_date?: string | null;
  reminder_days_before?: number | null;
  weight_kg?: number | null;
  vet_appointment_date?: string | null;
}

export interface UpcomingCareItem {
  log_id: number;
  pet_id: number;
  pet_name: string;
  log_type: PetLogType;
  title: string;
  next_due_date: string;
  reminder_days_before: number | null;
  days_until: number;
}

export const PET_SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: 'Dog',
  cat: 'Cat',
  rabbit: 'Rabbit',
  bird: 'Bird',
  fish: 'Fish',
  reptile: 'Reptile',
  other: 'Other',
};

export const LOG_TYPE_LABELS: Record<PetLogType, string> = {
  vaccination: 'Vaccination',
  flea_treatment: 'Flea Treatment',
  worming: 'Worming',
  weight: 'Weight',
  medication: 'Medication',
  vet_visit: 'Vet Visit',
  document: 'Document',
  other: 'Other',
};

export const LOG_TYPE_COLOURS: Record<PetLogType, string> = {
  vaccination: '#10b981',
  flea_treatment: '#f59e0b',
  worming: '#8b5cf6',
  weight: '#3b82f6',
  medication: '#ef4444',
  vet_visit: '#f97316',
  document: '#6b7280',
  other: '#64748b',
};
