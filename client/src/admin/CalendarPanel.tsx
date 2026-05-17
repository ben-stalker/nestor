import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import Button from '../shared/ui/Button';

interface CalendarAccount {
  id: number;
  provider: 'google' | 'apple' | 'yahoo' | 'custom';
  display_name: string;
  caldav_url: string | null;
  sync_interval_mins: number;
  last_sync_at: number | null;
  last_sync_error: string | null;
  active: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WFH_VALUES = ['home', 'office', 'away', ''] as const;
type WfhValue = (typeof WFH_VALUES)[number];

const SYNC_INTERVALS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

function providerLabel(p: string): string {
  return (
    {
      google: 'Google Calendar',
      apple: 'Apple iCloud',
      yahoo: 'Yahoo Calendar',
      custom: 'Custom CalDAV',
    }[p] ?? p
  );
}

function formatSync(ts: number | null): string {
  if (!ts) return 'Never';
  const diff = Math.floor((Date.now() - ts) / 60_000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function CalendarPanel() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();
  const [addOpen, setAddOpen] = useState(false);

  const { data: accounts = [] } = useQuery<CalendarAccount[]>({
    queryKey: ['calendar-accounts'],
    queryFn: () => apiFetch('/api/v1/calendar/accounts'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/v1/calendar/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-accounts'] });
    },
  });

  const intervalMut = useMutation({
    mutationFn: ({ id, interval }: { id: number; interval: number }) =>
      apiFetch(`/api/v1/calendar/accounts/${id}/sync-interval`, {
        method: 'PATCH',
        body: { interval },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-accounts'] });
    },
  });

  const wfhSchedule = (settings?.wfh_schedule ?? {}) as Record<string, Record<string, string>>;

  function setWfh(profileId: string, day: string, value: WfhValue) {
    const next = {
      ...wfhSchedule,
      [profileId]: { ...(wfhSchedule[profileId] ?? {}), [day]: value },
    };
    void apiFetch('/api/v1/settings', { method: 'PATCH', body: { wfh_schedule: next } }).then(
      () => {
        void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
      },
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Connected accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-body font-semibold text-primary">Connected accounts</h2>
          <Button variant="primary" onClick={() => setAddOpen((v) => !v)}>
            <Plus size={14} /> Add account
          </Button>
        </div>

        {addOpen && (
          <div className="mb-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
            <p className="text-caption font-medium text-secondary mb-3">Choose provider to add</p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/calendar/google/setup"
                className="block p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-body text-center transition-colors"
              >
                Google Calendar
              </a>
              <a
                href="/calendar/apple/setup"
                className="block p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-body text-center transition-colors"
              >
                Apple iCloud
              </a>
              <a
                href="/calendar/yahoo/setup"
                className="block p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-body text-center transition-colors"
              >
                Yahoo Calendar
              </a>
              <a
                href="/calendar/custom/setup"
                className="block p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-body text-center transition-colors"
              >
                Custom CalDAV
              </a>
            </div>
          </div>
        )}

        {accounts.length === 0 ? (
          <p className="text-body text-secondary py-4">No calendar accounts connected.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-primary">{acc.display_name}</p>
                  <p className="text-caption text-secondary">
                    {providerLabel(acc.provider)} · Last sync: {formatSync(acc.last_sync_at)}
                  </p>
                  {acc.last_sync_error && (
                    <p className="text-caption text-red-500 mt-0.5 truncate">
                      {acc.last_sync_error}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className="border border-neutral-200 rounded-lg px-2 py-1 text-caption bg-white outline-none"
                    value={acc.sync_interval_mins}
                    onChange={(e) =>
                      intervalMut.mutate({ id: acc.id, interval: Number(e.target.value) })
                    }
                    aria-label="Sync interval"
                  >
                    {SYNC_INTERVALS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${acc.display_name}?`)) deleteMut.mutate(acc.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
                    aria-label="Remove account"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WFH Schedule */}
      <section>
        <h2 className="text-body font-semibold text-primary mb-3">WFH / Shift schedule</h2>
        <p className="text-caption text-secondary mb-3">
          Set the default weekly pattern for each adult profile. Shows on the day carousel.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-caption border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-secondary">Profile</th>
                {DAYS.map((d) => (
                  <th key={d} className="px-2 py-2 font-medium text-secondary text-center w-12">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(wfhSchedule).length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-secondary text-center">
                    No WFH schedule set.
                  </td>
                </tr>
              )}
              {Object.entries(wfhSchedule).map(([profileId, sched]) => (
                <tr key={profileId} className="border-t border-neutral-100">
                  <td className="py-2 pr-4 text-primary font-medium">{profileId}</td>
                  {DAYS.map((day, i) => {
                    const dayKey = String(i + 1);
                    const val = (sched[dayKey] ?? '') as WfhValue;
                    return (
                      <td key={day} className="px-1 py-2 text-center">
                        <select
                          className="border border-neutral-200 rounded-lg px-1 py-0.5 text-caption bg-white outline-none w-16"
                          value={val}
                          onChange={(e) => setWfh(profileId, dayKey, e.target.value as WfhValue)}
                          aria-label={`${day} schedule`}
                        >
                          <option value="">—</option>
                          <option value="home">🏠</option>
                          <option value="office">🏢</option>
                          <option value="away">✈️</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-secondary mt-2">
          Add profiles to the schedule by typing their ID (numeric) in the table above.{' '}
          <button
            type="button"
            className="text-mode-calendar underline"
            onClick={() => {
              const id = window.prompt('Profile ID to add:');
              if (id) setWfh(id, '1', 'home');
            }}
          >
            Add profile
          </button>
        </p>
      </section>
    </div>
  );
}
