import { useState } from 'react';
import { Zap, Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '../shared/ui/Button';
import Skeleton from '../shared/ui/Skeleton';
import EmptyState from '../shared/ui/EmptyState';
import ChargingLogForm from './ChargingLogForm';
import { useChargingLogs, useCreateChargingLog, useUpdateChargingLog, useDeleteChargingLog } from './hooks/useEvCharging';
import type { EvChargingLog, EvChargingLogInput, EvChargingLogUpdate } from './types';
import useAppStore from '../store/appStore';

interface Vehicle {
  id: number;
  nickname: string;
  type: string;
}

interface Props {
  vehicles: Vehicle[];
  selectedVehicleId?: number;
  onVehicleChange?: (id: number | undefined) => void;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCost(minor: number | null) {
  if (minor === null) return '—';
  return `£${(minor / 100).toFixed(2)}`;
}

export default function ChargingLogList({ vehicles, selectedVehicleId, onVehicleChange }: Props) {
  const evVehicles = vehicles.filter((v) => v.type === 'ev');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EvChargingLog | undefined>();
  const adminPin = useAppStore((s) => s.adminPin);

  const { data: logs = [], isLoading } = useChargingLogs(selectedVehicleId);
  const create = useCreateChargingLog();
  const update = useUpdateChargingLog();
  const del = useDeleteChargingLog();

  function handleSave(data: EvChargingLogInput | { id: number; patch: EvChargingLogUpdate }) {
    if ('id' in data) {
      update.mutate(
        { id: data.id, patch: data.patch },
        { onSuccess: () => setEditing(undefined) },
      );
    } else {
      create.mutate(data, { onSuccess: () => setShowForm(false) });
    }
  }

  function handleDelete(id: number) {
    if (!adminPin) return;
    del.mutate({ id, adminPin });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {evVehicles.length > 1 && (
            <select
              className="rounded-button border border-neutral-200 px-3 py-1.5 text-body bg-surface text-sm"
              value={selectedVehicleId ?? ''}
              onChange={(e) =>
                onVehicleChange?.(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">All EVs</option>
              {evVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname}
                </option>
              ))}
            </select>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-1" />
          Log Session
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && logs.length === 0 && (
        <EmptyState
          icon={<Zap size={32} />}
          heading="No charging sessions"
          body="Log your first EV charging session to start tracking energy usage."
        />
      )}

      {!isLoading && logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => {
            const vehicle = vehicles.find((v) => v.id === log.vehicle_id);
            return (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-card bg-surface border border-neutral-100"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-mode-ev/10 flex items-center justify-center text-mode-ev">
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium">{log.kwh} kWh</span>
                    {log.location && (
                      <span className="text-caption text-secondary">{log.location}</span>
                    )}
                  </div>
                  <div className="text-caption text-secondary flex items-center gap-2">
                    <span>{formatDate(log.session_date)}</span>
                    {vehicle && evVehicles.length > 1 && <span>· {vehicle.nickname}</span>}
                    <span>· {formatCost(log.cost_minor)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded text-secondary hover:text-primary hover:bg-neutral-100"
                    onClick={() => setEditing(log)}
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  {adminPin && (
                    <button
                      className="p-1.5 rounded text-secondary hover:text-urgent hover:bg-urgent/10"
                      onClick={() => handleDelete(log.id)}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showForm || editing) && (
        <ChargingLogForm
          vehicleId={selectedVehicleId ?? evVehicles[0]?.id ?? 0}
          vehicles={vehicles}
          entry={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
