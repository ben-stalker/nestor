import { useState } from 'react';
import { patchSettings } from '../api';

const NAV_MODES = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'food', label: 'Food' },
  { id: 'family', label: 'Family' },
  { id: 'house', label: 'House' },
  { id: 'finance', label: 'Finance' },
  { id: 'pets', label: 'Pets' },
  { id: 'ev', label: 'EV' },
  { id: 'board', label: 'Board' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'vehicles', label: 'Vehicles' },
];

interface FeaturesStepProps {
  onNext: () => void;
}

export default function FeaturesStep({ onNext }: FeaturesStepProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(NAV_MODES.map((m) => m.id)));
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const canProceed = enabled.size >= 1;

  async function handleNext() {
    if (!canProceed) return;
    setSaving(true);
    try {
      await patchSettings({ enabled_nav_modes: Array.from(enabled) });
    } finally {
      setSaving(false);
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      <p className="text-body text-secondary">
        Choose which sections to show in the navigation. You can change these later.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {NAV_MODES.map((mode) => {
          const isEnabled = enabled.has(mode.id);
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => toggle(mode.id)}
              aria-pressed={isEnabled}
              className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-colors ${
                isEnabled
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isEnabled ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                }`}
              >
                {isEnabled && (
                  <svg
                    viewBox="0 0 12 12"
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="1,6 4,10 11,2" />
                  </svg>
                )}
              </div>
              <span className="text-body font-medium text-primary">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {!canProceed && (
        <p className="text-caption text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Select at least one section to continue.
        </p>
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            void handleNext();
          }}
          disabled={!canProceed || saving}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Next'}
        </button>
      </div>
    </div>
  );
}
