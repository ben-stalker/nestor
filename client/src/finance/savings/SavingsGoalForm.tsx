import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { createSavingsGoal, updateSavingsGoal } from '../api';
import type { SavingsGoal } from '../types';

interface Props {
  open: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
}

function toDateInput(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toISOString().split('T')[0];
}

function fromDateInput(s: string): number | null {
  if (!s) return null;
  return new Date(s).getTime();
}

function poundsToMinor(s: string): number {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

function minorToPounds(minor: number | null | undefined): string {
  if (minor == null) return '';
  return (minor / 100).toFixed(2);
}

export default function SavingsGoalForm({ open, goal, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!goal;

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0.00');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (goal) {
        setName(goal.name);
        setTarget(minorToPounds(goal.target_amount_minor));
        setCurrent(minorToPounds(goal.current_amount_minor));
        setTargetDate(toDateInput(goal.target_date));
      } else {
        setName('');
        setTarget('');
        setCurrent('0.00');
        setTargetDate('');
      }
      setError('');
    }
  }, [open, goal]);

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      isEdit ? updateSavingsGoal(goal.id, payload) : createSavingsGoal(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['savings-goals'] });
      onClose();
    },
    onError: () => setError('Failed to save. Please try again.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !target) {
      setError('Name and target amount are required.');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      target_amount_minor: poundsToMinor(target),
      current_amount_minor: poundsToMinor(current),
      currency: 'GBP',
      target_date: fromDateInput(targetDate),
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Goal' : 'Add Savings Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label className="block text-caption font-medium text-primary mb-1">Goal name *</label>
          <input
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Holiday Fund"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-medium text-primary mb-1">Target (£) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-primary mb-1">
              Saved so far (£)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-caption font-medium text-primary mb-1">
            Target date (optional)
          </label>
          <input
            type="date"
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        {error && <p className="text-caption text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saveMutation.isPending}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
