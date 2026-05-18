import { useState } from 'react';
import { patchSettings } from '../api';

type OrientationValue = 'portrait' | 'landscape';

function detectOrientation(): OrientationValue {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

interface OrientationStepProps {
  onNext: () => void;
}

export default function OrientationStep({ onNext }: OrientationStepProps) {
  const [selected, setSelected] = useState<OrientationValue>(detectOrientation());
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    try {
      await patchSettings({ orientation: selected });
    } finally {
      setSaving(false);
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      <p className="text-body text-secondary">
        Choose the orientation that matches how your display is mounted.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSelected('portrait')}
          aria-pressed={selected === 'portrait'}
          className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-colors ${
            selected === 'portrait'
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-400'
          }`}
        >
          <div className="w-12 h-20 rounded-lg border-2 border-current flex items-center justify-center">
            <div className="w-6 h-1.5 bg-current rounded-full" />
          </div>
          <span className="text-body font-semibold text-primary">Portrait</span>
          <span className="text-caption text-secondary text-center">Taller than wide</span>
        </button>

        <button
          type="button"
          onClick={() => setSelected('landscape')}
          aria-pressed={selected === 'landscape'}
          className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-colors ${
            selected === 'landscape'
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-400'
          }`}
        >
          <div className="w-20 h-12 rounded-lg border-2 border-current flex items-center justify-center">
            <div className="h-6 w-1.5 bg-current rounded-full" />
          </div>
          <span className="text-body font-semibold text-primary">Landscape</span>
          <span className="text-caption text-secondary text-center">Wider than tall</span>
        </button>
      </div>

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

export { detectOrientation };
