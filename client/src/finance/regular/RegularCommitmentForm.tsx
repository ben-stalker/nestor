import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { createRegularCommitment, updateRegularCommitment } from '../api';
import type { RegularCommitment, CommitmentDirection } from '../types';

interface Props {
  open: boolean;
  commitment: RegularCommitment | null;
  onClose: () => void;
}

const DIRECTIONS: Array<{ value: CommitmentDirection; label: string }> = [
  { value: 'out', label: 'Outgoing (expense)' },
  { value: 'in', label: 'Incoming (income/benefit)' },
];

const CATEGORIES = [
  'Rent',
  'Pension',
  'Childcare',
  'Council Tax',
  'Salary',
  'Universal Credit',
  'Child Benefit',
  'Tax Credit',
  'Other',
];

function poundsToMinor(s: string): number {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

function minorToPounds(minor: number): string {
  return (minor / 100).toFixed(2);
}

export default function RegularCommitmentForm({ open, commitment, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!commitment;
  const submitLabel = isEdit ? 'Save changes' : 'Add commitment';

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<CommitmentDirection>('out');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(commitment?.name ?? '');
      setAmount(commitment ? minorToPounds(commitment.amount_minor) : '');
      setDirection(commitment?.direction ?? 'out');
      setDayOfMonth(commitment?.day_of_month ? String(commitment.day_of_month) : '');
      setCategory(commitment?.category ?? '');
      setNotes(commitment?.notes ?? '');
      setError('');
    }
  }, [open, commitment]);

  const mutation = useMutation({
    mutationFn: (data: object) =>
      isEdit ? updateRegularCommitment(commitment.id, data) : createRegularCommitment(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['regular-commitments'] });
      void qc.invalidateQueries({ queryKey: ['finance-summary'] });
      onClose();
    },
    onError: () => setError('Failed to save commitment. Please try again.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountMinor = poundsToMinor(amount);
    if (!name.trim() || amountMinor <= 0) {
      setError('Name and a valid amount are required.');
      return;
    }
    const day = dayOfMonth ? parseInt(dayOfMonth, 10) : null;
    if (day !== null && (day < 1 || day > 31)) {
      setError('Day of month must be between 1 and 31.');
      return;
    }
    mutation.mutate({
      name: name.trim(),
      amount_minor: amountMinor,
      direction,
      day_of_month: day,
      category: category || null,
      notes: notes || null,
      currency: 'GBP',
    });
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-surface-elev border border-surface-border text-primary text-body focus:outline-none focus:ring-2 focus:ring-accent';
  const labelCls = 'block text-caption text-secondary mb-1';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Commitment' : 'Add Regular Commitment'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Child Benefit"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Direction *</label>
          <select
            className={inputCls}
            value={direction}
            onChange={(e) => setDirection(e.target.value as CommitmentDirection)}
          >
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Monthly amount (£) *</label>
          <input
            className={inputCls}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Day of month (optional)</label>
          <input
            className={inputCls}
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            placeholder="e.g. 1, 15, 28"
          />
        </div>

        <div>
          <label className={labelCls}>Category (optional)</label>
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">— select —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <textarea
            className={inputCls}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details..."
          />
        </div>

        {error && <p className="text-caption text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
