import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, EmptyState } from '../../shared/ui';
import { getFinanceSummary } from '../api';
import type { CommitmentCategory } from '../types';

function formatMinor(minor: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(minor / 100);
}

function CategoryRow({ cat }: { cat: CommitmentCategory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex justify-between items-center py-2">
          <p className="text-body font-medium text-primary">{cat.label}</p>
          <div className="flex items-center gap-2">
            <p className="text-body font-semibold text-primary">
              {formatMinor(cat.monthly_total_minor)}
            </p>
            <span className="text-caption text-secondary" aria-hidden="true">
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <ul className="pl-3 pb-2 space-y-1 border-l-2 border-surface-elev ml-1">
          {cat.items.map((item) => (
            <li
              key={`${item.source}-${item.id}`}
              className="flex justify-between text-caption text-secondary"
            >
              <span>{item.name}</span>
              <span>{formatMinor(item.monthly_minor)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CommitmentsSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: getFinanceSummary,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading summary...</p>;
  }

  const categories = data?.categories ?? [];
  const grandTotal = data?.grand_total_minor ?? 0;

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-h2 font-semibold text-primary">Monthly Commitments</h2>

      {categories.length === 0 ? (
        <EmptyState
          heading="No commitments"
          body="Add finance agreements or subscriptions to see your monthly committed outgoings."
        />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-surface-elev" role="list">
              {categories.map((cat) => (
                <CategoryRow key={cat.label} cat={cat} />
              ))}
            </ul>
          </Card>

          <Card className="bg-surface-elev">
            <div className="flex justify-between items-center">
              <p className="text-body font-medium text-secondary">Total committed monthly</p>
              <p className="text-h2 font-bold text-primary" data-testid="grand-total">
                {formatMinor(grandTotal)}
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
