import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, Button, EmptyState } from '../../shared/ui';
import { useBinSchedules, useBinUpcoming, useDeleteBinSchedule } from '../hooks/useBinSchedules';
import BinScheduleForm from './BinScheduleForm';
import type { BinSchedule } from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQ_LABELS: Record<number, string> = {
  1: 'Weekly',
  2: 'Fortnightly',
  4: 'Every 4 weeks',
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function BinScheduleList() {
  const { data: bins = [], isLoading } = useBinSchedules();
  const { data: upcoming } = useBinUpcoming(14);
  const deleteMutation = useDeleteBinSchedule();
  const [editBin, setEditBin] = useState<BinSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);

  function nextDateForBin(binId: number): number | undefined {
    const entry = upcoming?.bins.find((b) => b.bin.id === binId);
    return entry?.dates[0];
  }

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading bins...</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Bin Schedules</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          Add Bin
        </Button>
      </div>

      {bins.length === 0 ? (
        <EmptyState
          heading="No bin schedules"
          body="Add a bin schedule to track collection days."
        />
      ) : (
        <ul className="space-y-3" role="list">
          {bins.map((bin) => {
            const nextDate = nextDateForBin(bin.id);
            return (
              <li key={bin.id}>
                <Card>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: bin.colour }}
                      aria-hidden="true"
                    >
                      <Trash2 className="size-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-primary truncate">{bin.name}</p>
                      <p className="text-caption text-secondary">
                        {DAY_NAMES[bin.day_of_week]} · {FREQ_LABELS[bin.frequency_weeks]}
                      </p>
                      {nextDate && (
                        <p className="text-caption text-accent font-medium">
                          Next: {formatDate(nextDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditBin(bin);
                          setShowForm(true);
                        }}
                        aria-label={`Edit ${bin.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMutation.mutate(bin.id)}
                        aria-label={`Delete ${bin.name}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <BinScheduleForm
        open={showForm}
        bin={editBin}
        onClose={() => {
          setShowForm(false);
          setEditBin(null);
        }}
      />
    </div>
  );
}
