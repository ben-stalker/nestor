import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState, Pill } from '../../shared/ui';
import { getSubscriptions, deleteSubscription } from '../api';
import SubscriptionForm from './SubscriptionForm';
import type { Subscription } from '../types';

function formatCost(minor: number): string {
  return `£${(minor / 100).toFixed(2)}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CATEGORY_COLOURS: Record<string, string> = {
  streaming: '#7C3AED',
  software: '#0369A1',
  services: '#059669',
  other: '#6B7280',
};

export default function SubscriptionList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [showForm, setShowForm] = useState(false);

  const subscriptions = data?.subscriptions ?? [];
  const totalMonthlyCost = data?.totalMonthlyCost ?? 0;

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Subscriptions</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          Add
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState heading="No subscriptions" body="Add your recurring subscriptions." />
      ) : (
        <>
          <ul className="space-y-3" role="list">
            {subscriptions.map((sub) => (
              <li key={sub.id}>
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-body font-medium text-primary">{sub.name}</p>
                        <Pill colour={CATEGORY_COLOURS[sub.category]}>{sub.category}</Pill>
                        {sub.trial_end_date && <Pill>Trial</Pill>}
                      </div>
                      <p className="text-caption text-secondary mt-0.5">
                        Renews: {formatDate(sub.renewal_date)}
                      </p>
                      {sub.trial_end_date && (
                        <p className="text-caption text-accent">
                          Trial ends: {formatDate(sub.trial_end_date)}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-body font-semibold text-primary">
                        {formatCost(sub.monthly_cost)}/mo
                      </p>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditSub(sub);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteMutation.mutate(sub.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Card className="bg-surface-elev">
            <div className="flex justify-between items-center">
              <p className="text-body font-medium text-secondary">Total monthly</p>
              <p className="text-h2 font-bold text-primary" data-testid="total-cost">
                {formatCost(totalMonthlyCost)}
              </p>
            </div>
          </Card>
        </>
      )}

      <SubscriptionForm
        open={showForm}
        subscription={editSub}
        onClose={() => {
          setShowForm(false);
          setEditSub(null);
        }}
      />
    </div>
  );
}
