import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, EmptyState } from '../../shared/ui';
import { getBudgetSummary } from '../api';
import AddExpenseModal from './AddExpenseModal';
import CategoryForm from './CategoryForm';
import ExpenseList from './ExpenseList';
import type { BudgetCategory } from '../types';

function formatCost(minor: number): string {
  return `£${(minor / 100).toFixed(2)}`;
}

export default function BudgetSummary() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);

  const { data: summary = [], isLoading } = useQuery({
    queryKey: ['budget-summary', year, month],
    queryFn: () => getBudgetSummary(year, month),
    staleTime: 60_000,
  });

  const totalBudget = summary.reduce((sum, e) => sum + e.budget_minor, 0);
  const totalSpent = summary.reduce((sum, e) => sum + e.spent_minor, 0);

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading budget...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">
          Budget —{' '}
          {new Date(year, month - 1).toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowCategoryForm(true)}>
            Categories
          </Button>
          <Button size="sm" onClick={() => setShowAddExpense(true)}>
            Add Expense
          </Button>
        </div>
      </div>

      {summary.length === 0 ? (
        <EmptyState
          heading="No budget categories"
          body="Create categories to start tracking your budget."
        />
      ) : (
        <>
          <ul className="space-y-3" role="list">
            {summary.map((entry) => {
              const pct =
                entry.budget_minor > 0
                  ? Math.min((entry.spent_minor / entry.budget_minor) * 100, 100)
                  : 0;
              const isOver = entry.spent_minor > entry.budget_minor && entry.budget_minor > 0;

              return (
                <li key={entry.category.id}>
                  <Card>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory?.id === entry.category.id ? null : entry.category,
                        )
                      }
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          {entry.category.colour && (
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: entry.category.colour }}
                              aria-hidden="true"
                            />
                          )}
                          <p className="text-body font-medium text-primary">
                            {entry.category.name}
                          </p>
                        </div>
                        <p
                          className={`text-body font-semibold ${isOver ? 'text-red-500' : 'text-primary'}`}
                        >
                          {formatCost(entry.spent_minor)} / {formatCost(entry.budget_minor)}
                        </p>
                      </div>
                      <div
                        className="h-2 rounded-full bg-surface-elev overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.round(pct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-accent'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>

                    {selectedCategory?.id === entry.category.id && (
                      <div className="mt-3 pt-3 border-t border-surface-elev">
                        <ExpenseList categoryId={entry.category.id} year={year} month={month} />
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>

          <Card className="bg-surface-elev">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-body font-medium text-secondary">Total spending</p>
                <p className="text-caption text-secondary">Budget: {formatCost(totalBudget)}</p>
              </div>
              <p className="text-h2 font-bold text-primary" data-testid="total-spent">
                {formatCost(totalSpent)}
              </p>
            </div>
          </Card>
        </>
      )}

      <AddExpenseModal open={showAddExpense} onClose={() => setShowAddExpense(false)} />

      <CategoryForm open={showCategoryForm} onClose={() => setShowCategoryForm(false)} />
    </div>
  );
}
