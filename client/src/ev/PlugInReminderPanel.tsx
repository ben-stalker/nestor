import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff } from 'lucide-react';
import Button from '../shared/ui/Button';
import type { Vehicle } from '../vehicles/types';
import apiFetch from '../api/client';
import useAppStore from '../store/appStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  vehicles: Vehicle[];
}

function VehicleReminderCard({ vehicle }: { vehicle: Vehicle }) {
  const adminPin = useAppStore((s) => s.adminPin);
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(vehicle.plug_in_reminder_time ?? '21:00');
  const [days, setDays] = useState<number[]>(vehicle.plug_in_reminder_days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'X-Admin-Pin': adminPin ?? '' },
        body: JSON.stringify({
          plug_in_reminder_time: time,
          plug_in_reminder_days: days,
        }),
      });
      await qc.invalidateQueries({ queryKey: ['vehicles'] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function clearReminder() {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'X-Admin-Pin': adminPin ?? '' },
        body: JSON.stringify({
          plug_in_reminder_time: null,
          plug_in_reminder_days: null,
        }),
      });
      await qc.invalidateQueries({ queryKey: ['vehicles'] });
    } finally {
      setSaving(false);
    }
  }

  async function snoozeTonight() {
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 0);
    setSaving(true);
    try {
      await apiFetch(`/api/v1/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'X-Admin-Pin': adminPin ?? '' },
        body: JSON.stringify({ plug_in_snoozed_until: Math.floor(midnight.getTime() / 1000) }),
      });
      await qc.invalidateQueries({ queryKey: ['vehicles'] });
    } finally {
      setSaving(false);
    }
  }

  const hasReminder = vehicle.plug_in_reminder_time !== null;
  const isSnoozed =
    vehicle.plug_in_snoozed_until !== null &&
    Date.now() / 1000 < (vehicle.plug_in_snoozed_until ?? 0);

  return (
    <div className="p-4 rounded-card bg-surface border border-neutral-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasReminder ? (
            <Bell size={18} className="text-mode-ev" />
          ) : (
            <BellOff size={18} className="text-secondary" />
          )}
          <span className="text-body font-medium">{vehicle.nickname}</span>
        </div>
        {adminPin && (
          <div className="flex gap-2">
            {hasReminder && !editing && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={saving}
                  onClick={() => { void clearReminder(); }}
                >
                  Remove
                </Button>
              </>
            )}
            {!hasReminder && !editing && (
              <Button size="sm" onClick={() => setEditing(true)}>
                Set Reminder
              </Button>
            )}
          </div>
        )}
      </div>

      {hasReminder && !editing && (
        <div className="text-caption text-secondary space-y-1">
          <p>
            Remind at {vehicle.plug_in_reminder_time} on{' '}
            {(vehicle.plug_in_reminder_days ?? []).map((d) => DAYS[d]).join(', ')}
          </p>
          {isSnoozed && <p className="text-info">Snoozed until midnight tonight</p>}
          {!isSnoozed && adminPin && (
            <button
              className="text-caption text-mode-ev underline"
              onClick={() => { void snoozeTonight(); }}
            >
              Mark as plugged in (snooze tonight)
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-caption text-secondary mb-1">Reminder time</label>
            <input
              type="time"
              className="rounded-button border border-neutral-200 px-3 py-2 text-body bg-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-caption text-secondary mb-2">Reminder days</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-2.5 py-1 rounded text-caption font-medium transition-colors ${
                    days.includes(i)
                      ? 'bg-mode-ev text-white'
                      : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" loading={saving} onClick={() => { void save(); }}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlugInReminderPanel({ vehicles }: Props) {
  const evVehicles = vehicles.filter((v) => v.type === 'ev');

  if (evVehicles.length === 0) {
    return (
      <p className="text-body text-secondary text-center py-8">
        No EV vehicles registered. Add an EV in the Vehicles module first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {evVehicles.map((v) => (
        <VehicleReminderCard key={v.id} vehicle={v} />
      ))}
    </div>
  );
}
