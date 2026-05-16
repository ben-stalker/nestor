import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Card } from '../../shared/ui';
import { getBudgetCategories, createBudgetCategory, deleteBudgetCategory } from '../api';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
}

export default function CategoryForm({ open, onClose }: CategoryFormProps) {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: getBudgetCategories,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createBudgetCategory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budget-categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudgetCategory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budget-categories'] });
      void qc.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [colour, setColour] = useState('#3B82F6');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      {
        name,
        monthly_budget_minor: Math.round(parseFloat(budget) * 100),
        colour,
      },
      {
        onSuccess: () => {
          setName('');
          setBudget('');
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Categories">
      <div className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Budget £"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            className="w-24 rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
          <input
            type="color"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            className="h-10 w-10 rounded-button border border-surface-elev"
          />
          <Button type="submit" loading={createMutation.isPending}>
            Add
          </Button>
        </form>

        <ul className="space-y-2" role="list">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Card padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cat.colour && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.colour }}
                        aria-hidden="true"
                      />
                    )}
                    <p className="text-body text-primary">{cat.name}</p>
                    <p className="text-caption text-secondary">
                      £{(cat.monthly_budget_minor / 100).toFixed(2)}/mo
                    </p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(cat.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
