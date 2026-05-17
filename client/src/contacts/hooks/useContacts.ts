import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listContacts, createContact, updateContact, deleteContact } from '../api';
import type { ContactCategory, ContactInput } from '../types';

export function useContacts(category?: ContactCategory) {
  return useQuery({
    queryKey: ['contacts', category ?? 'all'],
    queryFn: () => listContacts(category),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) => createContact(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<ContactInput> }) =>
      updateContact(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
