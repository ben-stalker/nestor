import apiFetch from '../api/client';
import type { Contact, ContactInput, ContactCategory } from './types';

export function listContacts(category?: ContactCategory): Promise<Contact[]> {
  const qs = category ? `?category=${category}` : '';
  return apiFetch<Contact[]>(`/api/v1/contacts${qs}`);
}

export function getContact(id: number): Promise<Contact> {
  return apiFetch<Contact>(`/api/v1/contacts/${id}`);
}

export function createContact(input: ContactInput): Promise<Contact> {
  return apiFetch<Contact>('/api/v1/contacts', { method: 'POST', body: input });
}

export function updateContact(id: number, input: Partial<ContactInput>): Promise<Contact> {
  return apiFetch<Contact>(`/api/v1/contacts/${id}`, { method: 'PATCH', body: input });
}

export function deleteContact(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/contacts/${id}`, { method: 'DELETE' });
}
