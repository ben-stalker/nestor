import { useState, useEffect } from 'react';
import Modal from '../shared/ui/Modal';
import Button from '../shared/ui/Button';
import type { EvChargingLog, EvChargingLogInput, EvChargingLogUpdate } from './types';

interface Props {
  vehicleId: number;
  vehicles: Array<{ id: number; nickname: string; type: string }>;
  entry?: EvChargingLog;
  onSave: (data: EvChargingLogInput | { id: number; patch: EvChargingLogUpdate }) => void;
  onClose: () => void;
}

export default function ChargingLogForm({ vehicleId, vehicles, entry, onSave, onClose }: Props) {
  const evVehicles = vehicles.filter((v) => v.type === 'ev');
  const [form, setForm] = useState({
    vehicle_id: entry?.vehicle_id ?? vehicleId,
    session_date: entry
      ? new Date(entry.session_date * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    kwh: entry ? String(entry.kwh) : '',
    cost_minor: entry?.cost_minor != null ? String(entry.cost_minor / 100) : '',
    location: entry?.location ?? '',
    notes: entry?.notes ?? '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (!entry && evVehicles.length === 1) {
      setForm((f) => ({ ...f, vehicle_id: evVehicles[0].id }));
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const kwh = parseFloat(form.kwh);
    if (!kwh || kwh <= 0) {
      setError('kWh must be a positive number');
      return;
    }
    const sessionDate = Math.floor(new Date(form.session_date).getTime() / 1000);
    const costMinor =
      form.cost_minor !== '' ? Math.round(parseFloat(form.cost_minor) * 100) : null;

    if (entry) {
      onSave({
        id: entry.id,
        patch: {
          session_date: sessionDate,
          kwh,
          cost_minor: costMinor,
          location: form.location || null,
          notes: form.notes || null,
        },
      });
    } else {
      onSave({
        vehicle_id: form.vehicle_id,
        session_date: sessionDate,
        kwh,
        cost_minor: costMinor,
        location: form.location || null,
        notes: form.notes || null,
      });
    }
  }

  return (
    <Modal open onClose={onClose}>
      <h2 className="text-h2 font-semibold mb-4">
        {entry ? 'Edit Charging Session' : 'Log Charging Session'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!entry && evVehicles.length > 1 && (
          <div>
            <label className="block text-caption text-secondary mb-1">Vehicle</label>
            <select
              className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-surface"
              value={form.vehicle_id}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_id: Number(e.target.value) }))}
            >
              {evVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-caption text-secondary mb-1">Date</label>
          <input
            type="date"
            required
            className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-surface"
            value={form.session_date}
            onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1">Energy charged (kWh)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 35.5"
            className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-surface"
            value={form.kwh}
            onChange={(e) => setForm((f) => ({ ...f, kwh: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1">Cost (£, optional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 7.50"
            className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-surface"
            value={form.cost_minor}
            onChange={(e) => setForm((f) => ({ ...f, cost_minor: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1">Location (optional)</label>
          <input
            type="text"
            placeholder="Home / Public charger"
            className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-surface"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1">Notes (optional)</label>
          <textarea
            rows={2}
            className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-surface resize-none"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {error && <p className="text-caption text-urgent">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1">
            {entry ? 'Save' : 'Log Session'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
