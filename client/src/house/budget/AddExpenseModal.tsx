import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { getBudgetCategories, createBudgetExpense } from '../api';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: getBudgetCategories,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createBudgetExpense,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budget-expenses'] });
      void qc.invalidateQueries({ queryKey: ['budget-summary'] });
      onClose();
    },
  });

  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount('');
      setNote('');
      setCategoryId(categories[0]?.id ?? '');
    }
  }, [open, categories]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return;
    createMutation.mutate({
      category_id: Number(categoryId),
      amount_minor: Math.round(parseFloat(amount) * 100),
      spent_date: new Date(date).getTime(),
      note: note || null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Amount (£)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}
