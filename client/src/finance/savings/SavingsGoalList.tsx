import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState } from '../../shared/ui';
import { getSavingsGoals, deleteSavingsGoal } from '../api';
import SavingsGoalForm from './SavingsGoalForm';
import type { SavingsGoal } from '../types';

function formatMinor(minor: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntil(ms: number): number {
  return Math.ceil((ms - Date.now()) / 86400000);
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct =
    goal.target_amount_minor > 0
      ? Math.min((goal.current_amount_minor / goal.target_amount_minor) * 100, 100)
      : 0;
  const isComplete = goal.current_amount_minor >= goal.target_amount_minor;

  const days = goal.target_date ? daysUntil(goal.target_date) : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-primary truncate">{goal.name}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-h2 font-bold text-primary">
              {formatMinor(goal.current_amount_minor, goal.currency)}
            </span>
            <span className="text-caption text-secondary">
              of {formatMinor(goal.target_amount_minor, goal.currency)}
            </span>
          </div>
          {goal.target_date && (
            <p className="text-caption text-secondary mt-1">
              Target: {formatDate(goal.target_date)}
              {days !== null && days > 0 && ` (${days} days)`}
              {days !== null && days <= 0 && ' (overdue)'}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div
        className="h-3 rounded-full bg-surface-elev overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name}: ${Math.round(pct)}% saved`}
      >
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-caption text-secondary">{Math.round(pct)}% saved</span>
        {isComplete && (
          <span className="text-caption text-green-500 font-medium">Goal reached!</span>
        )}
      </div>
    </Card>
  );
}

export default function SavingsGoalList() {
  const qc = useQueryClient();
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: getSavingsGoals,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['savings-goals'] });
    },
  });

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading savings goals...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Savings Goals</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditGoal(null);
            setShowForm(true);
          }}
        >
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          heading="No savings goals"
          body="Create a goal to track your progress towards financial targets."
        />
      ) : (
        <ul className="space-y-3" role="list">
          {goals.map((goal) => (
            <li key={goal.id}>
              <GoalCard
                goal={goal}
                onEdit={() => {
                  setEditGoal(goal);
                  setShowForm(true);
                }}
                onDelete={() => deleteMutation.mutate(goal.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <SavingsGoalForm
        open={showForm}
        goal={editGoal}
        onClose={() => {
          setShowForm(false);
          setEditGoal(null);
        }}
      />
    </div>
  );
}
