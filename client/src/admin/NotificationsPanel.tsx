import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import Button from '../shared/ui/Button';

interface ReminderWindow {
  id: string;
  label: string;
  minutesBefore: number;
  defaultMinutes: number;
}

const REMINDER_TYPES: ReminderWindow[] = [
  {
    id: 'vehicle_mot',
    label: 'Vehicle MOT',
    minutesBefore: 30 * 24 * 60,
    defaultMinutes: 30 * 24 * 60,
  },
  {
    id: 'vehicle_service',
    label: 'Vehicle service',
    minutesBefore: 14 * 24 * 60,
    defaultMinutes: 14 * 24 * 60,
  },
  {
    id: 'vehicle_tax',
    label: 'Vehicle tax',
    minutesBefore: 30 * 24 * 60,
    defaultMinutes: 30 * 24 * 60,
  },
  {
    id: 'vehicle_insurance',
    label: 'Vehicle insurance',
    minutesBefore: 30 * 24 * 60,
    defaultMinutes: 30 * 24 * 60,
  },
  {
    id: 'subscription_renewal',
    label: 'Subscription renewal',
    minutesBefore: 7 * 24 * 60,
    defaultMinutes: 7 * 24 * 60,
  },
  {
    id: 'finance_end_date',
    label: 'Finance agreement end',
    minutesBefore: 60 * 24 * 60,
    defaultMinutes: 60 * 24 * 60,
  },
  {
    id: 'pet_health',
    label: 'Pet health log (upcoming care)',
    minutesBefore: 7 * 24 * 60,
    defaultMinutes: 7 * 24 * 60,
  },
  {
    id: 'maintenance',
    label: 'Home maintenance due',
    minutesBefore: 7 * 24 * 60,
    defaultMinutes: 7 * 24 * 60,
  },
  {
    id: 'guest_arrival',
    label: 'Guest arrival checklist',
    minutesBefore: 7 * 24 * 60,
    defaultMinutes: 7 * 24 * 60,
  },
  { id: 'calendar_event', label: 'Calendar events', minutesBefore: 60, defaultMinutes: 60 },
];

function minutesToDaysHours(minutes: number): string {
  if (minutes >= 24 * 60) {
    const days = Math.round(minutes / (24 * 60));
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
}

function daysToMinutes(days: number): number {
  return days * 24 * 60;
}

export default function NotificationsPanel() {
  const { data: settings } = useAppSettings();
  const qc = useQueryClient();

  type ReminderWindowEntry = { id: string; minutesBefore: number };
  const savedWindows = (settings?.reminder_windows as ReminderWindowEntry[] | undefined) ?? [];

  const [windows, setWindows] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    savedWindows.forEach((w) => {
      map[w.id] = w.minutesBefore;
    });
    setWindows(map);
  }, [settings]);

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<void>('/api/v1/settings', { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  function save() {
    const reminderWindows = REMINDER_TYPES.map((t) => ({
      id: t.id,
      minutesBefore: windows[t.id] ?? t.defaultMinutes,
    }));
    mut.mutate({ reminder_windows: reminderWindows });
  }

  function setDays(id: string, days: number) {
    setWindows((prev) => ({ ...prev, [id]: daysToMinutes(days) }));
  }

  function getDays(id: string, def: number): number {
    const minutes = windows[id] ?? def;
    return Math.max(1, Math.round(minutes / (24 * 60)));
  }

  return (
    <div className="space-y-6 max-w-lg">
      <p className="text-caption text-secondary">
        Configure how many days in advance each reminder type fires. The nightly scheduler reads
        these values.
      </p>

      <div className="space-y-2">
        {REMINDER_TYPES.map((type) => {
          const days = getDays(type.id, type.defaultMinutes);
          return (
            <div
              key={type.id}
              className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-neutral-100 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-primary">{type.label}</p>
                <p className="text-caption text-secondary">
                  {minutesToDaysHours(windows[type.id] ?? type.defaultMinutes)} before
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(type.id, Number(e.target.value))}
                  className="w-16 border border-neutral-200 rounded-lg px-2 py-1 text-body text-center outline-none focus:ring-2 focus:ring-mode-calendar"
                  aria-label={`${type.label} advance days`}
                />
                <span className="text-caption text-secondary w-8">days</span>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="primary" onClick={save} disabled={mut.isPending}>
        <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
