import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VehicleCard from './VehicleCard';
import VehicleForm from './VehicleForm';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from './api';
import type { Vehicle } from './types';
import { useActiveProfile } from '../core/hooks/useActiveProfile';

interface Props {
  onSelect: (vehicle: Vehicle) => void;
}

export default function VehicleList({ onSelect }: Props) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null);
  const activeProfile = useActiveProfile();
  const isAdmin = activeProfile?.type === 'admin';

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const createMutation = useMutation({
    mutationFn: (input: object) => createVehicle(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: object }) => updateVehicle(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] });
      setEditingVehicle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVehicle(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] });
      setPendingDelete(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-card bg-surface-elev animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Vehicles</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-button bg-accent px-4 py-2 text-body font-medium text-white hover:opacity-90 transition-opacity"
          >
            Add vehicle
          </button>
        )}
      </div>

      {vehicles.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">
            🚗
          </span>
          <p className="text-body text-secondary">No vehicles yet</p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-button bg-accent px-4 py-2 text-body font-medium text-white hover:opacity-90"
            >
              Add your first vehicle
            </button>
          )}
        </div>
      )}

      {(showForm || editingVehicle) && (
        <div className="rounded-card bg-surface border border-surface-elev p-4">
          <h3 className="text-h2 font-semibold text-primary mb-4">
            {editingVehicle ? 'Edit vehicle' : 'New vehicle'}
          </h3>
          <VehicleForm
            vehicle={editingVehicle}
            onSubmit={(data) => {
              if (editingVehicle) {
                updateMutation.mutate({ id: editingVehicle.id, input: data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingVehicle(null);
            }}
            submitting={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      <div className="space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="relative group">
            <VehicleCard vehicle={v} onClick={() => onSelect(v)} />
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  aria-label={`Edit ${v.nickname}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingVehicle(v);
                    setShowForm(false);
                  }}
                  className="rounded bg-surface border border-surface-elev px-2 py-1 text-xs text-secondary hover:text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${v.nickname}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(v);
                  }}
                  className="rounded bg-surface border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {pendingDelete !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative z-10 rounded-card bg-surface p-6 shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-h2 font-semibold text-primary mb-2">Delete vehicle?</h2>
            <p className="text-body text-secondary mb-4">
              &ldquo;{pendingDelete.nickname}&rdquo; and all its bookings will be permanently
              deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-card border border-surface-elev px-4 py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
                className="rounded-card bg-red-500 px-4 py-2 text-body font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
