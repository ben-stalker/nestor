import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import Button from '../shared/ui/Button';

const TEXT_SIZES = [
  { id: 'normal', label: 'Normal', preview: '16px' },
  { id: 'large', label: 'Large', preview: '20px' },
  { id: 'x-large', label: 'X-Large', preview: '24px' },
];

const COLOUR_BLIND_PALETTES = [
  { id: 'none', label: 'Default (no filter)' },
  { id: 'deuteranopia', label: 'Deuteranopia (red-green)' },
  { id: 'protanopia', label: 'Protanopia (red-green, severe)' },
  { id: 'tritanopia', label: 'Tritanopia (blue-yellow)' },
];

interface AccessibilityForm {
  text_size_global: string;
  high_contrast: boolean;
  colour_blind_palette: string;
  reduced_motion_global: boolean;
  simplified_nav_global: boolean;
}

function buildForm(s: Record<string, unknown>): AccessibilityForm {
  return {
    text_size_global: (s.text_size_global as string) ?? 'normal',
    high_contrast: (s.high_contrast as boolean) ?? false,
    colour_blind_palette: (s.colour_blind_palette as string) ?? 'none',
    reduced_motion_global: (s.reduced_motion_global as boolean) ?? false,
    simplified_nav_global: (s.simplified_nav_global as boolean) ?? false,
  };
}

const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog.';

export default function AccessibilityPanel() {
  const { data: settings } = useAppSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<AccessibilityForm>(buildForm({}));

  useEffect(() => {
    if (settings) setForm(buildForm(settings as Record<string, unknown>));
  }, [settings]);

  const mut = useMutation({
    mutationFn: (body: AccessibilityForm) =>
      apiFetch<void>('/api/v1/settings', { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  function set<K extends keyof AccessibilityForm>(key: K, value: AccessibilityForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const previewFontSize =
    { normal: '1rem', large: '1.25rem', 'x-large': '1.5rem' }[form.text_size_global] ?? '1rem';

  return (
    <div className="space-y-6 max-w-lg">
      {/* Live preview */}
      <div
        className={`p-4 rounded-2xl border transition-all ${form.high_contrast ? 'bg-black border-white text-white' : 'bg-white border-neutral-200'}`}
        style={{ fontSize: previewFontSize }}
      >
        <p className="font-medium mb-1">Preview</p>
        <p>{PREVIEW_TEXT}</p>
        <p className="mt-1 opacity-70">Aa Bb Cc 1 2 3</p>
      </div>

      {/* Text size */}
      <section className="space-y-2">
        <h3 className="text-body font-semibold text-primary">Global text size</h3>
        <p className="text-caption text-secondary">
          Per-profile overrides available in the Profiles panel.
        </p>
        <div className="flex gap-2">
          {TEXT_SIZES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set('text_size_global', t.id)}
              className={`flex-1 py-3 rounded-xl border text-body font-medium transition-colors ${
                form.text_size_global === t.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-200 text-secondary hover:border-neutral-400'
              }`}
            >
              {t.label}
              <span className="block text-caption mt-0.5 opacity-70">{t.preview}</span>
            </button>
          ))}
        </div>
      </section>

      {/* High contrast */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body font-semibold text-primary">High contrast</h3>
            <p className="text-caption text-secondary">Increases text/background contrast ratio.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.high_contrast}
              onChange={(e) => set('high_contrast', e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      </section>

      {/* Colour-blind palette */}
      <section className="space-y-2">
        <h3 className="text-body font-semibold text-primary">Colour-blind palette</h3>
        <select
          value={form.colour_blind_palette}
          onChange={(e) => set('colour_blind_palette', e.target.value)}
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
        >
          {COLOUR_BLIND_PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </section>

      {/* Reduced motion */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body font-semibold text-primary">Reduced motion</h3>
            <p className="text-caption text-secondary">
              Disables animations and transitions globally.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.reduced_motion_global}
              onChange={(e) => set('reduced_motion_global', e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      </section>

      {/* Simplified nav */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body font-semibold text-primary">Simplified navigation</h3>
            <p className="text-caption text-secondary">
              Reduces nav to essential items for all profiles.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.simplified_nav_global}
              onChange={(e) => set('simplified_nav_global', e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      </section>

      <Button variant="primary" onClick={() => mut.mutate(form)} disabled={mut.isPending}>
        <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
