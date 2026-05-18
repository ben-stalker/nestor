import { Check } from 'lucide-react';

interface WizardProgressProps {
  current: number;
  total: number;
  steps: string[];
}

export default function WizardProgress({ current, total, steps }: WizardProgressProps) {
  return (
    <div className="w-full" aria-label={`Step ${current + 1} of ${total}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-caption text-secondary font-medium">
          {current + 1} / {total}
        </span>
        <span className="text-caption text-secondary">{steps[current]}</span>
      </div>
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const isCompleted = idx < current;
          const isCurrent = idx === current;
          return (
            <div key={step} className="flex-1 flex flex-col items-center gap-1" title={step}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-semibold transition-colors ${
                  isCompleted || isCurrent
                    ? `bg-neutral-900 text-white${isCurrent ? ' ring-2 ring-neutral-900 ring-offset-2' : ''}`
                    : 'bg-neutral-200 text-neutral-400'
                }`}
              >
                {isCompleted ? <Check size={12} /> : <span className="text-[10px]">{idx + 1}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-neutral-900 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
