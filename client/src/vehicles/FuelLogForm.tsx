import { useState } from 'react';
import type { FuelLog } from './types';

interface Props {
  initial?: FuelLog;
  submitting: boolean;
  onSubmit: (values: {
    date: number;
    litres: number;
    cost_minor: number;
    mileage: number | null;
  }) => void;
  onClose: () => void;
}

export default function FuelLogForm({ initial, submitting, onSubmit, onClose }: Props) {
  const [date, setDate] = useState(() =>
    initial
      ? new Date(initial.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [litres, setLitres] = useState(String(initial?.litres ?? ''));
  const [costPounds, setCostPounds] = useState(
    initial ? (initial.cost_minor / 100).toFixed(2) : '',
  );
  const [mileage, setMileage] = useState(String(initial?.mileage ?? ''));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const l = parseFloat(litres);
    const c = parseFloat(costPounds);
    if (!date || Number.isNaN(l) || l <= 0 || Number.isNaN(c) || c < 0) {
      setError('Please fill in date, litres, and cost.');
      return;
    }
    const m = mileage ? parseInt(mileage, 10) : null;
    onSubmit({
      date: new Date(date).getTime(),
      litres: l,
      cost_minor: Math.round(c * 100),
      mileage: m,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fuel log entry"
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
    >
      <div className="bg-surface rounded-t-card sm:rounded-card w-full sm:max-w-sm p-4 space-y-4">
        <h2 className="text-h2 font-semibold text-primary">
          {initial ? 'Edit fill-up' : 'Log fill-up'}
        </h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-secondary">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-secondary">Litres</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              placeholder="e.g. 45.2"
              className="mt-1 block w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-secondary">Cost (£)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPounds}
              onChange={(e) => setCostPounds(e.target.value)}
              placeholder="e.g. 68.50"
              className="mt-1 block w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-secondary">Odometer (miles, optional)</span>
            <input
              type="number"
              step="1"
              min="0"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="e.g. 54321"
              className="mt-1 block w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-button border border-surface-elev py-2 text-sm text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-button bg-accent py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
