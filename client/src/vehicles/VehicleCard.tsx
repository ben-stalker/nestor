import type { Vehicle } from './types';

const TYPE_ICON: Record<string, string> = {
  car: '🚗',
  van: '🚐',
  motorcycle: '🏍️',
  bicycle: '🚲',
  ev: '⚡',
};

function daysUntil(epochMs: number): number {
  return Math.ceil((epochMs - Date.now()) / 86_400_000);
}

interface RenewalChipProps {
  label: string;
  dueMs: number | null;
}

function chipColour(days: number): string {
  if (days <= 7) return 'bg-red-100 text-red-700';
  if (days <= 30) return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

function RenewalChip({ label, dueMs }: RenewalChipProps) {
  if (dueMs === null) return null;
  const days = daysUntil(dueMs);
  const colour = chipColour(days);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colour}`}>
      {label} {days < 0 ? 'overdue' : `${days}d`}
    </span>
  );
}

interface Props {
  vehicle: Vehicle;
  onClick: () => void;
}

export default function VehicleCard({ vehicle, onClick }: Props) {
  const showMot = vehicle.type !== 'bicycle' && vehicle.type !== 'ev';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-card bg-surface border border-surface-elev p-4 flex gap-3 hover:bg-surface-elev transition-colors"
    >
      {vehicle.photo_path ? (
        <img
          src={`/api/v1/vehicles/${vehicle.id}/photo`}
          alt={vehicle.nickname}
          className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-surface-elev flex items-center justify-center text-3xl flex-shrink-0">
          <span aria-hidden="true">{TYPE_ICON[vehicle.type] ?? '🚗'}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary truncate">{vehicle.nickname}</span>
          {vehicle.registration && (
            <span className="rounded bg-surface-elev px-1.5 py-0.5 text-xs text-secondary font-mono">
              {vehicle.registration}
            </span>
          )}
        </div>

        {(vehicle.make || vehicle.model) && (
          <p className="text-body text-secondary text-sm mt-0.5">
            {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mt-2">
          {showMot && <RenewalChip label="MOT" dueMs={vehicle.mot_due} />}
          <RenewalChip label="Tax" dueMs={vehicle.tax_due} />
          <RenewalChip label="Ins" dueMs={vehicle.insurance_due} />
          <RenewalChip label="Service" dueMs={vehicle.service_due} />
        </div>
      </div>
    </button>
  );
}
