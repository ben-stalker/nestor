import apiFetch from '../api/client';
import type {
  BoardMessage,
  CountdownTimer,
  WhiteboardSnapshot,
  BoardList,
  BoardListItem,
} from './types';

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function fetchMessages(includeArchived = false): Promise<BoardMessage[]> {
  return apiFetch(`/api/v1/board/messages${includeArchived ? '?archived=true' : ''}`);
}

export async function createMessage(content: string, pinned = false): Promise<BoardMessage> {
  return apiFetch('/api/v1/board/messages', {
    method: 'POST',
    body: JSON.stringify({ content, pinned }),
  });
}

export async function updateMessage(
  id: number,
  patch: Partial<Pick<BoardMessage, 'content' | 'pinned' | 'archived'>>,
): Promise<BoardMessage> {
  return apiFetch(`/api/v1/board/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function archiveMessage(id: number): Promise<BoardMessage> {
  return apiFetch(`/api/v1/board/messages/${id}/archive`, { method: 'POST' });
}

export async function deleteMessage(id: number): Promise<void> {
  return apiFetch(`/api/v1/board/messages/${id}`, { method: 'DELETE' });
}

// ─── Countdowns ───────────────────────────────────────────────────────────────

export async function fetchCountdowns(): Promise<CountdownTimer[]> {
  return apiFetch('/api/v1/board/countdowns');
}

export async function createCountdown(data: {
  name: string;
  target_date: number;
  show_on_home?: boolean;
  savings_goal_id?: number | null;
}): Promise<CountdownTimer> {
  return apiFetch('/api/v1/board/countdowns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCountdown(
  id: number,
  patch: Partial<Omit<CountdownTimer, 'id' | 'created_at'>>,
): Promise<CountdownTimer> {
  return apiFetch(`/api/v1/board/countdowns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteCountdown(id: number): Promise<void> {
  return apiFetch(`/api/v1/board/countdowns/${id}`, { method: 'DELETE' });
}

// ─── Whiteboard ───────────────────────────────────────────────────────────────

export async function fetchSnapshots(): Promise<WhiteboardSnapshot[]> {
  return apiFetch('/api/v1/board/whiteboard');
}

export async function saveSnapshot(name: string, blob: Blob): Promise<WhiteboardSnapshot> {
  const form = new FormData();
  form.append('snapshot', blob, 'whiteboard.png');
  form.append('name', name);
  const res = await fetch('/api/v1/board/whiteboard', {
    method: 'POST',
    body: form,
    headers: { 'x-profile-id': localStorage.getItem('activeProfileId') ?? '' },
  });
  if (!res.ok) throw new Error('Failed to save snapshot');
  return res.json() as Promise<WhiteboardSnapshot>;
}

export async function renameSnapshot(id: number, name: string): Promise<WhiteboardSnapshot> {
  return apiFetch(`/api/v1/board/whiteboard/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteSnapshot(id: number): Promise<void> {
  return apiFetch(`/api/v1/board/whiteboard/${id}`, { method: 'DELETE' });
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function fetchLists(): Promise<BoardList[]> {
  return apiFetch('/api/v1/board/lists');
}

export async function fetchList(id: number): Promise<BoardList> {
  return apiFetch(`/api/v1/board/lists/${id}`);
}

export async function createList(data: {
  name: string;
  type?: 'one_off' | 'recurring';
}): Promise<BoardList> {
  return apiFetch('/api/v1/board/lists', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateList(id: number, patch: Partial<BoardList>): Promise<BoardList> {
  return apiFetch(`/api/v1/board/lists/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function deleteList(id: number): Promise<void> {
  return apiFetch(`/api/v1/board/lists/${id}`, { method: 'DELETE' });
}

export async function createListItem(
  listId: number,
  text: string,
  sort_order = 0,
): Promise<BoardListItem> {
  return apiFetch(`/api/v1/board/lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify({ text, sort_order }),
  });
}

export async function updateListItem(
  listId: number,
  itemId: number,
  patch: Partial<Pick<BoardListItem, 'text' | 'ticked' | 'sort_order'>>,
): Promise<BoardListItem> {
  return apiFetch(`/api/v1/board/lists/${listId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteListItem(listId: number, itemId: number): Promise<void> {
  return apiFetch(`/api/v1/board/lists/${listId}/items/${itemId}`, { method: 'DELETE' });
}

export async function resetList(id: number): Promise<BoardList> {
  return apiFetch(`/api/v1/board/lists/${id}/reset`, { method: 'POST' });
}

// ─── Guest Checklists ─────────────────────────────────────────────────────────

export async function fetchGuestChecklists(): Promise<BoardList[]> {
  return apiFetch('/api/v1/board/guest-checklists');
}

export async function fetchGuestChecklist(id: number): Promise<BoardList> {
  return apiFetch(`/api/v1/board/guest-checklists/${id}`);
}

export async function createGuestChecklist(data: {
  name: string;
  guest_name: string;
  guest_arrival_date?: number | null;
  template?: 'arrival' | 'departure';
}): Promise<BoardList> {
  return apiFetch('/api/v1/board/guest-checklists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGuestChecklist(
  id: number,
  patch: Partial<BoardList>,
): Promise<BoardList> {
  return apiFetch(`/api/v1/board/guest-checklists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteGuestChecklist(id: number): Promise<void> {
  return apiFetch(`/api/v1/board/guest-checklists/${id}`, { method: 'DELETE' });
}

export async function createGuestItem(
  listId: number,
  text: string,
  sort_order = 0,
): Promise<BoardListItem> {
  return apiFetch(`/api/v1/board/guest-checklists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify({ text, sort_order }),
  });
}

export async function updateGuestItem(
  listId: number,
  itemId: number,
  patch: Partial<Pick<BoardListItem, 'text' | 'ticked' | 'sort_order'>>,
): Promise<BoardListItem> {
  return apiFetch(`/api/v1/board/guest-checklists/${listId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
