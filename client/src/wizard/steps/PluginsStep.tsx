import { Puzzle } from 'lucide-react';

interface PluginsStepProps {
  onNext: () => void;
}

export default function PluginsStep({ onNext }: PluginsStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 py-8 px-6 bg-neutral-50 rounded-2xl border border-neutral-200 text-center">
        <div className="w-14 h-14 rounded-2xl bg-neutral-200 flex items-center justify-center">
          <Puzzle size={28} className="text-neutral-500" />
        </div>
        <div>
          <p className="text-body font-semibold text-primary">Plugins arrive in Phase 2</p>
          <p className="text-caption text-secondary mt-1">
            Check back after the next update to connect third-party integrations like Tesla, smart
            home devices, and more.
          </p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90"
        >
          Next
        </button>
      </div>
    </div>
  );
}
