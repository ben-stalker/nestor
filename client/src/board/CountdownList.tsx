import { useState } from 'react';
import { Card, EmptyState, Button } from '../shared/ui';
import { useCountdowns, useCreateCountdown, useUpdateCountdown, useDeleteCountdown } from './hooks';
import type { CountdownTimer } from './types';

function daysUntil(targetMs: number): number {
  return Math.ceil((targetMs - Date.now()) / (1000 * 60 * 60 * 24));
}

function chipClass(days: number): string {
  if (days < 0) return 'bg-red-100 text-red-700';
  if (days <= 7) return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

function chipLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return 'Today!';
  return `${days}d`;
}

function DayChip({ days }: { days: number }) {
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${chipClass(days)}`}>
      {chipLabel(days)}
    </span>
  );
}

interface FormProps {
  initial?: Partial<CountdownTimer>;
  onSave: (data: { name: string; target_date: number; show_on_home: boolean }) => void;
  onClose: () => void;
  pending: boolean;
}

function CountdownForm({ initial, onSave, onClose, pending }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(
    initial?.target_date ? new Date(initial.target_date).toISOString().split('T')[0] : '',
  );
  const [showOnHome, setShowOnHome] = useState(initial?.show_on_home ?? false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onSave({ name: name.trim(), target_date: new Date(date).getTime(), show_on_home: showOnHome });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-surface w-full max-w-md rounded-card shadow-xl p-6 space-y-4">
        <h2 className="text-h2 font-semibold text-primary">
          {initial ? 'Edit Countdown' : 'New Countdown'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-caption text-secondary mb-1">Name</label>
            <input
              className="w-full rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Christmas, Holiday…"
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-caption text-secondary mb-1">Target date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-surface-elev bg-background p-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-body text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="accent-accent"
            />
            Show on home screen
          </label>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !date || pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CountdownList() {
  const { data: countdowns = [], isLoading } = useCountdowns();
  const create = useCreateCountdown();
  const update = useUpdateCountdown();
  const remove = useDeleteCountdown();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CountdownTimer | null>(null);

  if (isLoading) return <p className="text-secondary text-body p-4">Loading countdowns…</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Countdowns</h2>
        <Button onClick={() => setAdding(true)}>+ Add</Button>
      </div>

      {countdowns.length === 0 && (
        <EmptyState heading="No countdowns" body="Track upcoming events with day-count chips." />
      )}

      <ul className="space-y-3" role="list">
        {countdowns.map((cd) => {
          const days = daysUntil(cd.target_date);
          return (
            <li key={cd.id}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <DayChip days={days} />
                    <div>
                      <p className="text-body font-medium text-primary">{cd.name}</p>
                      <p className="text-caption text-secondary">
                        {new Date(cd.target_date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {cd.show_on_home && <span className="ml-2 text-accent">· Home</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(cd)}
                      className="text-caption text-secondary hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(cd.id)}
                      className="text-caption text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {adding && (
        <CountdownForm
          pending={create.isPending}
          onClose={() => setAdding(false)}
          onSave={(data) => create.mutate(data, { onSuccess: () => setAdding(false) })}
        />
      )}

      {editing && (
        <CountdownForm
          initial={editing}
          pending={update.isPending}
          onClose={() => setEditing(null)}
          onSave={(data) =>
            update.mutate({ id: editing.id, patch: data }, { onSuccess: () => setEditing(null) })
          }
        />
      )}
    </div>
  );
}
