import { useState } from 'react';
import { Card, EmptyState, Button } from '../shared/ui';
import {
  useLists,
  useList,
  useCreateList,
  useDeleteList,
  useCreateListItem,
  useUpdateListItem,
  useDeleteListItem,
  useResetList,
} from './hooks';
import type { BoardList } from './types';

function ListDetail({ list, onBack }: { list: BoardList; onBack: () => void }) {
  const { data: detail, isLoading } = useList(list.id);
  const addItem = useCreateListItem();
  const updateItem = useUpdateListItem();
  const deleteItem = useDeleteListItem();
  const reset = useResetList();
  const [newText, setNewText] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    addItem.mutate(
      { listId: list.id, text: newText.trim(), sort_order: detail?.items?.length ?? 0 },
      { onSuccess: () => setNewText('') },
    );
  }

  if (isLoading) return <p className="text-secondary text-body p-4">Loading…</p>;
  if (!detail) return null;

  const items = detail.items ?? [];
  const done = items.filter((i) => i.ticked).length;

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-caption text-accent hover:underline"
      >
        ← Back to lists
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-semibold text-primary">{detail.name}</h2>
          <p className="text-caption text-secondary">
            {done}/{items.length} done
            {detail.type === 'recurring' && ' · Recurring'}
          </p>
        </div>
        {detail.type === 'recurring' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => reset.mutate(detail.id)}
            loading={reset.isPending}
          >
            Reset
          </Button>
        )}
      </div>

      <Card>
        <ul className="divide-y divide-surface-elev" role="list">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={item.ticked}
                onChange={(e) =>
                  updateItem.mutate({ listId: detail.id, itemId: item.id, patch: { ticked: e.target.checked } })
                }
                className="accent-accent w-5 h-5 shrink-0"
              />
              <span className={`text-body flex-1 ${item.ticked ? 'line-through text-secondary' : 'text-primary'}`}>
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => deleteItem.mutate({ listId: detail.id, itemId: item.id })}
                className="text-caption text-red-400 hover:text-red-600 shrink-0"
                aria-label="Delete item"
              >
                ×
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-4 text-body text-secondary text-center">No items yet</li>
          )}
        </ul>
      </Card>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Add item…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          maxLength={500}
        />
        <Button type="submit" size="sm" disabled={!newText.trim() || addItem.isPending}>
          Add
        </Button>
      </form>
    </div>
  );
}

interface NewListModalProps {
  onClose: () => void;
}

function NewListModal({ onClose }: NewListModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'one_off' | 'recurring'>('one_off');
  const create = useCreateList();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), type }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-surface w-full max-w-md rounded-card shadow-xl p-6 space-y-4">
        <h2 className="text-h2 font-semibold text-primary">New List</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption text-secondary mb-1">Name</label>
            <input
              className="w-full rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend jobs, Movie watchlist…"
              required
              maxLength={200}
              autoFocus
            />
          </div>
          <fieldset>
            <legend className="text-caption text-secondary mb-2">Type</legend>
            <div className="flex gap-3">
              {(['one_off', 'recurring'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 text-body text-secondary cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="accent-accent"
                  />
                  {t === 'one_off' ? 'One-off' : 'Recurring'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ListsTab() {
  const { data: lists = [], isLoading } = useLists();
  const remove = useDeleteList();
  const [selected, setSelected] = useState<BoardList | null>(null);
  const [adding, setAdding] = useState(false);

  if (selected) {
    return <ListDetail list={selected} onBack={() => setSelected(null)} />;
  }

  if (isLoading) return <p className="text-secondary text-body p-4">Loading lists…</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Lists</h2>
        <Button onClick={() => setAdding(true)}>+ New List</Button>
      </div>

      {lists.length === 0 && (
        <EmptyState heading="No lists" body="Create tickable lists for household tasks." />
      )}

      <ul className="space-y-2" role="list">
        {lists.map((list) => (
          <li key={list.id}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setSelected(list)}
                >
                  <p className="text-body font-medium text-primary">{list.name}</p>
                  <p className="text-caption text-secondary capitalize">
                    {list.type === 'one_off' ? 'One-off' : 'Recurring'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(list.id)}
                  className="text-caption text-red-400 hover:text-red-600 shrink-0"
                >
                  Delete
                </button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {adding && <NewListModal onClose={() => setAdding(false)} />}
    </div>
  );
}
