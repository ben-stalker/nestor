import { useState } from 'react';
import { Card, EmptyState, Button } from '../shared/ui';
import {
  useGuestChecklists,
  useGuestChecklist,
  useCreateGuestChecklist,
  useDeleteGuestChecklist,
  useCreateGuestItem,
  useUpdateGuestItem,
} from './hooks';
import type { BoardList } from './types';

function daysUntil(ms: number): number {
  return Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysColour(days: number): string {
  return days <= 3 ? 'text-amber-600' : 'text-blue-600';
}

function daysText(days: number, compact?: boolean): string {
  if (days > 0) return compact ? `${days}d` : `${days}d away`;
  if (days === 0) return compact ? 'today' : 'Today!';
  return 'past';
}

function DaysLabel({ days, compact }: { days: number; compact?: boolean }) {
  return (
    <span className={`ml-1 font-semibold ${daysColour(days)}`}>({daysText(days, compact)})</span>
  );
}

function GuestDetail({ guest, onBack }: { guest: BoardList; onBack: () => void }) {
  const { data: detail, isLoading } = useGuestChecklist(guest.id);
  const addItem = useCreateGuestItem();
  const updateItem = useUpdateGuestItem();
  const [newText, setNewText] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    addItem.mutate(
      { listId: guest.id, text: newText.trim(), sort_order: detail?.items?.length ?? 0 },
      { onSuccess: () => setNewText('') },
    );
  }

  if (isLoading) return <p className="text-secondary text-body p-4">Loading…</p>;
  if (!detail) return null;

  const items = detail.items ?? [];
  const done = items.filter((i) => i.ticked).length;
  const days = detail.guest_arrival_date ? daysUntil(detail.guest_arrival_date) : null;

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={onBack} className="text-caption text-accent hover:underline">
        ← Back to guest visits
      </button>

      <div>
        <h2 className="text-h2 font-semibold text-primary">{detail.guest_name}</h2>
        {detail.guest_arrival_date && (
          <p className="text-caption text-secondary">
            Arrives{' '}
            {new Date(detail.guest_arrival_date).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            })}
            {days !== null && <DaysLabel days={days} />}
          </p>
        )}
        <p className="text-caption text-secondary">
          {done}/{items.length} done
        </p>
      </div>

      <Card>
        <ul className="divide-y divide-surface-elev" role="list">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={item.ticked}
                onChange={(e) =>
                  updateItem.mutate({
                    listId: detail.id,
                    itemId: item.id,
                    patch: { ticked: e.target.checked },
                  })
                }
                className="accent-accent w-5 h-5 shrink-0"
              />
              <span
                className={`text-body flex-1 ${item.ticked ? 'line-through text-secondary' : 'text-primary'}`}
              >
                {item.text}
              </span>
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

interface NewGuestModalProps {
  onClose: () => void;
}

function NewGuestModal({ onClose }: NewGuestModalProps) {
  const [guestName, setGuestName] = useState('');
  const [listName, setListName] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [template, setTemplate] = useState<'arrival' | 'departure'>('arrival');
  const create = useCreateGuestChecklist();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    create.mutate(
      {
        name: listName.trim() || `${guestName.trim()} visit`,
        guest_name: guestName.trim(),
        guest_arrival_date: arrivalDate ? new Date(arrivalDate).getTime() : null,
        template,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-surface w-full max-w-md rounded-card shadow-xl p-6 space-y-4">
        <h2 className="text-h2 font-semibold text-primary">New Guest Visit</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption text-secondary mb-1">Guest name *</label>
            <input
              className="w-full rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Mum & Dad"
              required
              maxLength={200}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-caption text-secondary mb-1">List name (optional)</label>
            <input
              className="w-full rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Defaults to guest name"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-caption text-secondary mb-1">Arrival date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
            />
          </div>
          <fieldset>
            <legend className="text-caption text-secondary mb-2">Template</legend>
            <div className="flex gap-3">
              {(['arrival', 'departure'] as const).map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 text-body text-secondary cursor-pointer"
                >
                  <input
                    type="radio"
                    name="template"
                    value={t}
                    checked={template === t}
                    onChange={() => setTemplate(t)}
                    className="accent-accent"
                  />
                  {t === 'arrival' ? 'Pre-arrival' : 'Post-departure'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!guestName.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GuestVisitTab() {
  const { data: guests = [], isLoading } = useGuestChecklists();
  const remove = useDeleteGuestChecklist();
  const [selected, setSelected] = useState<BoardList | null>(null);
  const [adding, setAdding] = useState(false);

  if (selected) {
    return <GuestDetail guest={selected} onBack={() => setSelected(null)} />;
  }

  if (isLoading) return <p className="text-secondary text-body p-4">Loading guest visits…</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Guest Visits</h2>
        <Button onClick={() => setAdding(true)}>+ Add Guest</Button>
      </div>

      {guests.length === 0 && (
        <EmptyState
          heading="No guest visits"
          body="Track pre-arrival and post-departure checklists for guests."
        />
      )}

      <ul className="space-y-2" role="list">
        {guests.map((g) => {
          const days = g.guest_arrival_date ? daysUntil(g.guest_arrival_date) : null;
          return (
            <li key={g.id}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <button type="button" className="flex-1 text-left" onClick={() => setSelected(g)}>
                    <p className="text-body font-medium text-primary">{g.guest_name}</p>
                    <p className="text-caption text-secondary">
                      {g.name}
                      {g.guest_arrival_date && (
                        <span className="ml-2">
                          ·{' '}
                          {new Date(g.guest_arrival_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {days !== null && <DaysLabel days={days} compact />}
                        </span>
                      )}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(g.id)}
                    className="text-caption text-red-400 hover:text-red-600 shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {adding && <NewGuestModal onClose={() => setAdding(false)} />}
    </div>
  );
}
