import { useState } from 'react';
import { CheckCircle, SkipForward } from 'lucide-react';
import { completeSetup } from '../api';

const STEP_NAMES = [
  'Language',
  'Locale',
  'Profiles',
  'Calendars',
  'Display',
  'Orientation',
  'Voice',
  'Features',
  'Plugins',
];

interface DoneStepProps {
  skippedSteps: Set<number>;
  onFinish: () => void;
}

export default function DoneStep({ skippedSteps, onFinish }: DoneStepProps) {
  const [saving, setSaving] = useState(false);

  const completedCount = STEP_NAMES.length - skippedSteps.size;
  const skippedCount = skippedSteps.size;

  async function handleFinish() {
    setSaving(true);
    try {
      await completeSetup();
    } finally {
      setSaving(false);
    }
    onFinish();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center">
          <CheckCircle size={32} className="text-white" />
        </div>
        <div>
          <p className="text-h2 font-bold text-primary">Nestor is ready!</p>
          <p className="text-body text-secondary mt-1">
            Your household dashboard has been configured.
          </p>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 space-y-2">
        <p className="text-caption font-semibold text-secondary uppercase tracking-wide">Summary</p>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-body text-primary">
            {completedCount} step{completedCount !== 1 ? 's' : ''} completed
          </span>
        </div>
        {skippedCount > 0 && (
          <div className="flex items-center gap-2">
            <SkipForward size={16} className="text-neutral-400" />
            <span className="text-body text-secondary">
              {skippedCount} step{skippedCount !== 1 ? 's' : ''} skipped — configure in Admin
              settings
            </span>
          </div>
        )}

        {skippedCount > 0 && (
          <div className="mt-2 space-y-1">
            {STEP_NAMES.map((name, idx) =>
              skippedSteps.has(idx) ? (
                <p key={name} className="text-caption text-neutral-400 pl-6">
                  • {name}
                </p>
              ) : null,
            )}
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            void handleFinish();
          }}
          disabled={saving}
          className="px-6 py-3 bg-neutral-900 text-white rounded-button font-semibold text-body transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Setting up…' : 'Finish — Open Nestor'}
        </button>
      </div>
    </div>
  );
}
