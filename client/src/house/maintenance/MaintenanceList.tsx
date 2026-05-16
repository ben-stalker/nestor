import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState, Pill } from '../../shared/ui';
import { getMaintenanceItems, deleteMaintenanceItem, updateMaintenanceItem } from '../api';
import MaintenanceForm from './MaintenanceForm';
import type { HomeMaintenance, MaintenanceType } from '../types';

const TYPE_COLOURS: Record<MaintenanceType, string> = {
  job: '#DC2626',
  warranty: '#0369A1',
  reminder: '#D97706',
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MaintenanceList() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | undefined>();
  const [editItem, setEditItem] = useState<HomeMaintenance | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['maintenance', typeFilter],
    queryFn: () => getMaintenanceItems(typeFilter),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceItem,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (id: number) => updateMaintenanceItem(id, { landlord_report: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading maintenance...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Maintenance</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          Add
        </Button>
      </div>

      <div className="flex gap-2" role="group" aria-label="Filter by type">
        {(['all', 'job', 'warranty', 'reminder'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t === 'all' ? undefined : t)}
            className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
              (t === 'all' && !typeFilter) || typeFilter === t
                ? 'bg-accent text-white'
                : 'bg-surface-elev text-secondary hover:text-primary'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState heading="No items" body="Add maintenance jobs, warranties, and reminders." />
      ) : (
        <ul className="space-y-3" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-body font-medium text-primary">{item.title}</p>
                      <Pill colour={TYPE_COLOURS[item.type]}>{item.type}</Pill>
                      {item.landlord_report && <Pill>Reported</Pill>}
                    </div>
                    {item.next_due_date && (
                      <p className="text-caption text-secondary mt-1">
                        Due: {formatDate(item.next_due_date)}
                      </p>
                    )}
                    {item.completed_date && (
                      <p className="text-caption text-secondary mt-1">
                        Completed: {formatDate(item.completed_date)}
                      </p>
                    )}
                    {item.cost !== null && (
                      <p className="text-caption text-secondary">
                        Cost: £{(item.cost / 100).toFixed(2)}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-caption text-secondary mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {item.renter_mode && !item.landlord_report && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => reportMutation.mutate(item.id)}
                        loading={reportMutation.isPending}
                      >
                        Report to landlord
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditItem(item);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <MaintenanceForm
        open={showForm}
        item={editItem}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
      />
    </div>
  );
}
