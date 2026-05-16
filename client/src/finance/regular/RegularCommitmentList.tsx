import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState, Pill } from '../../shared/ui';
import { getRegularCommitments, deleteRegularCommitment } from '../api';
import RegularCommitmentForm from './RegularCommitmentForm';
import type { RegularCommitment } from '../types';

function formatMinor(minor: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);
}

const DIRECTION_COLOURS: Record<string, string> = {
  out: '#DC2626',
  in: '#059669',
};

const DIRECTION_LABELS: Record<string, string> = {
  out: 'Outgoing',
  in: 'Incoming',
};

export default function RegularCommitmentList() {
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [editCommitment, setEditCommitment] = useState<RegularCommitment | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['regular-commitments', showAll],
    queryFn: () => getRegularCommitments(!showAll),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRegularCommitment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['regular-commitments'] });
      void qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });

  const outgoing = commitments.filter((c) => c.active && c.direction === 'out');
  const incoming = commitments.filter((c) => c.active && c.direction === 'in');
  const totalOut = outgoing.reduce((sum, c) => sum + c.amount_minor, 0);
  const totalIn = incoming.reduce((sum, c) => sum + c.amount_minor, 0);

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading commitments...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Regular Commitments</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Active only' : 'Show all'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditCommitment(null);
              setShowForm(true);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {commitments.length === 0 ? (
        <EmptyState
          heading="No regular commitments"
          body="Track standing orders, rent, pension contributions, benefits, and salary."
        />
      ) : (
        <>
          <ul className="space-y-3" role="list">
            {commitments.map((c) => (
              <li key={c.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill colour={DIRECTION_COLOURS[c.direction] ?? '#6B7280'}>
                          {DIRECTION_LABELS[c.direction] ?? c.direction}
                        </Pill>
                        {c.category && <Pill colour="#6B7280">{c.category}</Pill>}
                        {!c.active && <Pill colour="#9CA3AF">Inactive</Pill>}
                      </div>
                      <p className="text-body font-medium text-primary truncate">{c.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="text-caption text-secondary">
                          <span className="font-medium text-primary">
                            {formatMinor(c.amount_minor, c.currency)}
                          </span>
                          /mo
                        </span>
                        {c.day_of_month && (
                          <span className="text-caption text-secondary">
                            Day {c.day_of_month} of month
                          </span>
                        )}
                      </div>
                      {c.notes && (
                        <p className="text-caption text-secondary mt-1 truncate">{c.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditCommitment(c);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => deleteMutation.mutate(c.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {(totalOut > 0 || totalIn > 0) && (
            <Card className="bg-surface-elev">
              <div className="space-y-2">
                {totalOut > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-body text-secondary">Total outgoing/mo</p>
                    <p className="text-h2 font-bold text-red-500">{formatMinor(totalOut)}</p>
                  </div>
                )}
                {totalIn > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-body text-secondary">Total incoming/mo</p>
                    <p className="text-h2 font-bold text-green-500">{formatMinor(totalIn)}</p>
                  </div>
                )}
                {totalOut > 0 && totalIn > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                    <p className="text-body font-medium text-secondary">Net/mo</p>
                    <p
                      className={`text-h2 font-bold ${totalIn - totalOut >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {formatMinor(Math.abs(totalIn - totalOut))}
                      {totalIn - totalOut >= 0 ? ' surplus' : ' deficit'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      <RegularCommitmentForm
        open={showForm}
        commitment={editCommitment}
        onClose={() => {
          setShowForm(false);
          setEditCommitment(null);
        }}
      />
    </div>
  );
}
