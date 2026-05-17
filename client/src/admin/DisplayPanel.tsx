import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import Button from '../shared/ui/Button';

interface DisplayForm {
  orientation: string;
  idle_dim_seconds: number;
  idle_sleep_seconds: number;
  idle_dim_level: number;
  night_mode_enabled: boolean;
  night_mode_start: string;
  night_mode_end: string;
  night_mode_dim_level: number;
  screensaver_folder: string;
  screensaver_interval_seconds: number;
}

function settingsToForm(s: Record<string, unknown>): DisplayForm {
  return {
    orientation: (s.orientation as string) ?? 'auto',
    idle_dim_seconds: (s.idle_dim_seconds as number) ?? 120,
    idle_sleep_seconds: (s.idle_sleep_seconds as number) ?? 600,
    idle_dim_level: (s.idle_dim_level as number) ?? 0.3,
    night_mode_enabled: (s.night_mode_enabled as boolean) ?? false,
    night_mode_start: (s.night_mode_start as string) ?? '22:00',
    night_mode_end: (s.night_mode_end as string) ?? '07:00',
    night_mode_dim_level: (s.night_mode_dim_level as number) ?? 0.1,
    screensaver_folder: (s.screensaver_folder as string) ?? '',
    screensaver_interval_seconds: (s.screensaver_interval_seconds as number) ?? 30,
  };
}

export default function DisplayPanel() {
  const { data: settings } = useAppSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<DisplayForm>(settingsToForm({}));

  useEffect(() => {
    if (settings) setForm(settingsToForm(settings as Record<string, unknown>));
  }, [settings]);

  const mut = useMutation({
    mutationFn: (body: Partial<DisplayForm>) =>
      apiFetch<void>('/api/v1/settings', { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  function f<K extends keyof DisplayForm>(key: K, value: DisplayForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    mut.mutate(form);
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Orientation */}
      <section className="space-y-2">
        <h3 className="text-body font-semibold text-primary">Orientation</h3>
        <div className="flex gap-2">
          {['auto', 'portrait', 'landscape'].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => f('orientation', o)}
              className={`px-4 py-2 rounded-xl border text-body font-medium transition-colors ${
                form.orientation === o
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-200 text-secondary hover:border-neutral-400'
              }`}
            >
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Idle */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Idle timeouts</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-caption font-medium text-secondary mb-1">
              Dim after (seconds)
            </label>
            <input
              type="number"
              min={10}
              max={3600}
              value={form.idle_dim_seconds}
              onChange={(e) => f('idle_dim_seconds', Number(e.target.value))}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-secondary mb-1">
              Sleep after (seconds)
            </label>
            <input
              type="number"
              min={30}
              max={7200}
              value={form.idle_sleep_seconds}
              onChange={(e) => f('idle_sleep_seconds', Number(e.target.value))}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-secondary mb-1">
              Dim level ({Math.round(form.idle_dim_level * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={form.idle_dim_level}
              onChange={(e) => f('idle_dim_level', parseFloat(e.target.value))}
              className="w-full accent-mode-calendar"
            />
          </div>
        </div>
      </section>

      {/* Night mode */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-primary">Night mode</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.night_mode_enabled}
              onChange={(e) => f('night_mode_enabled', e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
        {form.night_mode_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">
                Start time
              </label>
              <input
                type="time"
                value={form.night_mode_start}
                onChange={(e) => f('night_mode_start', e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">End time</label>
              <input
                type="time"
                value={form.night_mode_end}
                onChange={(e) => f('night_mode_end', e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">
                Night dim ({Math.round(form.night_mode_dim_level * 100)}%)
              </label>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={form.night_mode_dim_level}
                onChange={(e) => f('night_mode_dim_level', parseFloat(e.target.value))}
                className="w-full accent-mode-calendar"
              />
            </div>
          </div>
        )}
      </section>

      {/* Screensaver */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Screensaver</h3>
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Photo folder path
          </label>
          <input
            type="text"
            value={form.screensaver_folder}
            onChange={(e) => f('screensaver_folder', e.target.value)}
            placeholder="/home/nestor/photos"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
          />
        </div>
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Transition every {form.screensaver_interval_seconds}s
          </label>
          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={form.screensaver_interval_seconds}
            onChange={(e) => f('screensaver_interval_seconds', Number(e.target.value))}
            className="w-full accent-mode-calendar"
          />
        </div>
      </section>

      <Button variant="primary" onClick={save} disabled={mut.isPending}>
        <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
