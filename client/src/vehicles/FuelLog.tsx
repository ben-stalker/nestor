import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog } from './api';
import FuelLogForm from './FuelLogForm';
import MpgChart from './MpgChart';
import type { Vehicle, FuelLog as FuelLogType } from './types';
import { useActiveProfile } from '../core/hooks/useActiveProfile';

function computeEfficiency(
  entry: FuelLogType,
  prevEntry: FuelLogType | undefined,
): { mpg: number; l100km: number } | null {
  if (!entry.mileage || !prevEntry?.mileage) return null;
  const milesDriven = entry.mileage - prevEntry.mileage;
  if (milesDriven <= 0) return null;
  const mpg = milesDriven / (entry.litres / 4.546);
  const km = milesDriven * 1.609;
  const l100km = (entry.litres * 100) / km;
  return { mpg, l100km };
}

interface Props {
  vehicle: Vehicle;
}

export default function FuelLog({ vehicle }: Props) {
  const qc = useQueryClient();
  const activeProfile = useActiveProfile();
  const isAdmin = activeProfile?.type === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<FuelLogType | null>(null);

  if (vehicle.type === 'ev') {
    return (
      <div className="rounded-card bg-surface border border-surface-elev p-4 text-center">
        <p className="text-sm text-secondary">Fuel log not applicable for electric vehicles.</p>
        <p className="text-xs text-secondary mt-1">Use the EV charging log (coming soon).</p>
      </div>
    );
  }

  const { data: logs = [] } = useQuery({
    queryKey: ['fuel-logs', vehicle.id],
    queryFn: () => getFuelLogs(vehicle.id),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (values: object) => createFuelLog(vehicle.id, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fuel-logs', vehicle.id] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ entryId, values }: { entryId: number; values: object }) =>
      updateFuelLog(vehicle.id, entryId, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fuel-logs', vehicle.id] });
      setEditEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: number) => deleteFuelLog(vehicle.id, entryId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fuel-logs', vehicle.id] });
    },
  });

  // Build chart data from last 12 entries (ascending order for chart)
  const chartEntries = [...logs].slice(0, 12).reverse();
  const chartPoints = chartEntries
    .map((entry, i) => {
      const prev = chartEntries[i - 1];
      const eff = computeEfficiency(entry, prev);
      return eff
        ? {
            label: new Date(entry.date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            }),
            value: eff.mpg,
          }
        : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  function handleFormSubmit(values: {
    date: number;
    litres: number;
    cost_minor: number;
    mileage: number | null;
  }) {
    if (editEntry) {
      updateMutation.mutate({ entryId: editEntry.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="rounded-card bg-surface border border-surface-elev p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-secondary">Fuel log</p>
        <button
          type="button"
          onClick={() => {
            setEditEntry(null);
            setShowForm(true);
          }}
          className="rounded-button bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          + Fill-up
        </button>
      </div>

      {chartPoints.length >= 2 && <MpgChart points={chartPoints} unit="mpg" />}

      {logs.length === 0 ? (
        <p className="text-sm text-secondary text-center py-4">No fill-ups logged yet.</p>
      ) : (
        <ul className="divide-y divide-surface-elev">
          {logs.map((entry, i) => {
            // logs is sorted descending — prev entry in time is logs[i+1]
            const eff = computeEfficiency(entry, logs[i + 1]);
            return (
              <li key={entry.id} className="py-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-secondary">
                    {entry.litres.toFixed(1)}L · £{(entry.cost_minor / 100).toFixed(2)}
                    {entry.mileage ? ` · ${entry.mileage.toLocaleString()} mi` : ''}
                    {eff ? ` · ${eff.mpg.toFixed(1)} mpg` : ''}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditEntry(entry);
                        setShowForm(true);
                      }}
                      className="text-xs text-accent hover:underline px-1"
                      aria-label="Edit fill-up"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="text-xs text-red-600 hover:underline px-1"
                      aria-label="Delete fill-up"
                    >
                      Del
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(showForm || editEntry) && (
        <FuelLogForm
          initial={editEntry ?? undefined}
          submitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditEntry(null);
          }}
        />
      )}
    </div>
  );
}
