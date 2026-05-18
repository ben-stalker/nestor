import WizardProgress from './WizardProgress';
import Button from '../shared/ui/Button';

const STEP_TITLES = [
  'Language',
  'Locale',
  'Profiles',
  'Calendars',
  'Display',
  'Orientation',
  'Voice',
  'Features',
  'Plugins',
  'Done',
];

interface StepShellProps {
  title: string;
  currentStep: number;
  isFirst?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
}

export default function StepShell({
  title,
  currentStep,
  isFirst = false,
  onBack,
  children,
}: StepShellProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-surface z-50 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center">
            <span className="text-white font-bold text-caption">N</span>
          </div>
          <span className="text-body font-semibold text-primary">Nestor Setup</span>
        </div>
        <WizardProgress current={currentStep} total={STEP_TITLES.length} steps={STEP_TITLES} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h1 className="text-h1 font-bold text-primary mb-6">{title}</h1>
        {children}
      </div>

      {/* Footer — Back only */}
      {!isFirst && onBack && (
        <div className="flex-none px-6 py-4 border-t border-neutral-100 flex items-center">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
