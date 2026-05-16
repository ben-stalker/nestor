import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, EmptyState } from '../../shared/ui';
import { getChecklists } from '../api';
import ChecklistDetail from './ChecklistDetail';
import type { Checklist, ChecklistType } from '../types';

const TYPE_LABELS: Record<ChecklistType, string> = {
  daily_reset: 'Daily',
  trip: 'Trip',
  one_off: 'One-off',
  recurring: 'Recurring',
};

const TYPE_ORDER: ChecklistType[] = ['daily_reset', 'recurring', 'trip', 'one_off'];

export default function ChecklistList() {
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: getChecklists,
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading checklists...</p>;
  }

  if (selectedId !== null) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-4 text-caption text-accent hover:underline flex items-center gap-1"
        >
          ← Back to checklists
        </button>
        <ChecklistDetail checklistId={selectedId} />
      </div>
    );
  }

  const grouped = TYPE_ORDER.reduce<Record<ChecklistType, Checklist[]>>(
    (acc, type) => {
      acc[type] = checklists.filter((c) => c.type === type);
      return acc;
    },
    { daily_reset: [], recurring: [], trip: [], one_off: [] },
  );

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-h2 font-semibold text-primary">Checklists</h2>

      {checklists.length === 0 ? (
        <EmptyState heading="No checklists" body="Checklists will appear here once created." />
      ) : (
        TYPE_ORDER.map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          return (
            <section key={type}>
              <h3 className="text-caption font-semibold text-secondary uppercase tracking-wide mb-2">
                {TYPE_LABELS[type]}
              </h3>
              <ul className="space-y-2" role="list">
                {items.map((cl) => (
                  <li key={cl.id}>
                    <Card>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setSelectedId(cl.id)}
                      >
                        <p className="text-body font-medium text-primary">{cl.name}</p>
                        {cl.guest_name && (
                          <p className="text-caption text-secondary">Guest: {cl.guest_name}</p>
                        )}
                        {cl.last_reset_at && (
                          <p className="text-caption text-secondary">
                            Last reset:{' '}
                            {new Date(cl.last_reset_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        )}
                      </button>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
