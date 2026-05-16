import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMessages,
  createMessage,
  updateMessage,
  archiveMessage,
  deleteMessage,
  fetchCountdowns,
  createCountdown,
  updateCountdown,
  deleteCountdown,
  fetchSnapshots,
  saveSnapshot,
  renameSnapshot,
  deleteSnapshot,
  fetchLists,
  fetchList,
  createList,
  updateList,
  deleteList,
  createListItem,
  updateListItem,
  deleteListItem,
  resetList,
  fetchGuestChecklists,
  fetchGuestChecklist,
  createGuestChecklist,
  updateGuestChecklist,
  deleteGuestChecklist,
  createGuestItem,
  updateGuestItem,
} from './api';

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useMessages() {
  return useQuery({ queryKey: ['board', 'messages'], queryFn: () => fetchMessages() });
}

export function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, pinned }: { content: string; pinned?: boolean }) =>
      createMessage(content, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'messages'] }),
  });
}

export function useUpdateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateMessage>[1] }) =>
      updateMessage(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'messages'] }),
  });
}

export function useArchiveMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => archiveMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'messages'] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'messages'] }),
  });
}

// ─── Countdowns ───────────────────────────────────────────────────────────────

export function useCountdowns() {
  return useQuery({ queryKey: ['board', 'countdowns'], queryFn: fetchCountdowns });
}

export function useCreateCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createCountdown>[0]) => createCountdown(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'countdowns'] }),
  });
}

export function useUpdateCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateCountdown>[1] }) =>
      updateCountdown(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'countdowns'] }),
  });
}

export function useDeleteCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCountdown(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'countdowns'] }),
  });
}

// ─── Whiteboard ───────────────────────────────────────────────────────────────

export function useSnapshots() {
  return useQuery({ queryKey: ['board', 'snapshots'], queryFn: fetchSnapshots });
}

export function useSaveSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, blob }: { name: string; blob: Blob }) => saveSnapshot(name, blob),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'snapshots'] }),
  });
}

export function useRenameSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameSnapshot(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'snapshots'] }),
  });
}

export function useDeleteSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSnapshot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'snapshots'] }),
  });
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export function useLists() {
  return useQuery({ queryKey: ['board', 'lists'], queryFn: fetchLists });
}

export function useList(id: number) {
  return useQuery({ queryKey: ['board', 'lists', id], queryFn: () => fetchList(id) });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type?: 'one_off' | 'recurring' }) => createList(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'lists'] }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateList>[1] }) =>
      updateList(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'lists'] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteList(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', 'lists'] }),
  });
}

export function useCreateListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, text, sort_order }: { listId: number; text: string; sort_order?: number }) =>
      createListItem(listId, text, sort_order),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['board', 'lists', vars.listId] }),
  });
}

export function useUpdateListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      patch,
    }: {
      listId: number;
      itemId: number;
      patch: Parameters<typeof updateListItem>[2];
    }) => updateListItem(listId, itemId, patch),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['board', 'lists', vars.listId] }),
  });
}

export function useDeleteListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: number; itemId: number }) =>
      deleteListItem(listId, itemId),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['board', 'lists', vars.listId] }),
  });
}

export function useResetList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resetList(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: ['board', 'lists'] });
      void qc.invalidateQueries({ queryKey: ['board', 'lists', id] });
    },
  });
}

// ─── Guest Checklists ─────────────────────────────────────────────────────────

export function useGuestChecklists() {
  return useQuery({ queryKey: ['board', 'guests'], queryFn: fetchGuestChecklists });
}

export function useGuestChecklist(id: number) {
  return useQuery({ queryKey: ['board', 'guests', id], queryFn: () => fetchGuestChecklist(id) });
}

export function useCreateGuestChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createGuestChecklist>[0]) => createGuestChecklist(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['board', 'guests'] }); },
  });
}

export function useUpdateGuestChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateGuestChecklist>[1] }) =>
      updateGuestChecklist(id, patch),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['board', 'guests'] });
      void qc.invalidateQueries({ queryKey: ['board', 'guests', vars.id] });
    },
  });
}

export function useDeleteGuestChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGuestChecklist(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['board', 'guests'] }); },
  });
}

export function useCreateGuestItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, text, sort_order }: { listId: number; text: string; sort_order?: number }) =>
      createGuestItem(listId, text, sort_order),
    onSuccess: (_d, vars) => { void qc.invalidateQueries({ queryKey: ['board', 'guests', vars.listId] }); },
  });
}

export function useUpdateGuestItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      patch,
    }: {
      listId: number;
      itemId: number;
      patch: Parameters<typeof updateGuestItem>[2];
    }) => updateGuestItem(listId, itemId, patch),
    onSuccess: (_d, vars) => { void qc.invalidateQueries({ queryKey: ['board', 'guests', vars.listId] }); },
  });
}
