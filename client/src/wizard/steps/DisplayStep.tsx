import { useState } from 'react';
import { patchSettings } from '../api';

interface DisplayForm {
  idle_dim_seconds: number;
  night_mode_enabled: boolean;
  night_mode_start: string;
  night_mode_end: string;
}

interface DisplayStepProps {
  onNext: () => void;
}

export default function DisplayStep({ onNext }: DisplayStepProps) {
  const [form, setForm] = useState<DisplayForm>({
    idle_dim_seconds: 120,
    night_mode_enabled: false,
    night_mode_start: '22:00',
    night_mode_end: '07:00',
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof DisplayForm>(key: K, value: DisplayForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleNext() {
    setSaving(true);
    try {
      await patchSettings({
        idle_dim_seconds: form.idle_dim_seconds,
        night_mode_enabled: form.night_mode_enabled,
        night_mode_start: form.night_mode_start,
        night_mode_end: form.night_mode_end,
      });
    } finally {
      setSaving(false);
    }
    onNext();
  }

  return (
    <div className="space-y-6">
      <p className="text-body text-secondary">Configure display and power-saving settings.</p>

      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Idle brightness</h3>
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Dim after {form.idle_dim_seconds}s
          </label>
          <input
            type="range"
            min={30}
            max={600}
            step={10}
            value={form.idle_dim_seconds}
            onChange={(e) => set('idle_dim_seconds', Number(e.target.value))}
            className="w-full accent-mode-calendar"
          />
          <div className="flex justify-between text-caption text-neutral-400 mt-1">
            <span>30s</span>
            <span>600s</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-primary">Night mode</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.night_mode_enabled}
              onChange={(e) => set('night_mode_enabled', e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>

        {form.night_mode_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">Start time</label>
              <input
                type="time"
                value={form.night_mode_start}
                onChange={(e) => set('night_mode_start', e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">End time</label>
              <input
                type="time"
                value={form.night_mode_end}
                onChange={(e) => set('night_mode_end', e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              />
            </div>
          </div>
        )}
      </section>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => { void handleNext(); }}
          disabled={saving}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Next'}
        </button>
      </div>
    </div>
  );
}
