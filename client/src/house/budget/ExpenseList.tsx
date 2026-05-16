import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../shared/ui';
import { getBudgetExpenses, deleteBudgetExpense } from '../api';

interface ExpenseListProps {
  categoryId: number;
  year: number;
  month: number;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ExpenseList({ categoryId, year, month }: ExpenseListProps) {
  const qc = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['budget-expenses', categoryId, year, month],
    queryFn: () => getBudgetExpenses(categoryId, year, month),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudgetExpense,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budget-expenses'] });
      void qc.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });

  if (expenses.length === 0) {
    return <p className="text-caption text-secondary">No expenses this month.</p>;
  }

  return (
    <ul className="space-y-1" role="list">
      {expenses.map((exp) => (
        <li key={exp.id} className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-body text-primary">£{(exp.amount_minor / 100).toFixed(2)}</span>
            {exp.note && <span className="text-caption text-secondary ml-2">{exp.note}</span>}
            <span className="text-caption text-secondary ml-2">{formatDate(exp.spent_date)}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate(exp.id)}
            aria-label="Delete expense"
          >
            ×
          </Button>
        </li>
      ))}
    </ul>
  );
}
