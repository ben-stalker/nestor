import type VehicleRepository from '../../repositories/VehicleRepository';
import type AlertRepository from '../../repositories/AlertRepository';
import type { Vehicle } from '../../types/vehicles';

const DEFAULT_WINDOWS: Record<string, number[]> = {
  mot: [30, 14, 7, 1],
  tax: [14, 3, 1],
  insurance: [28, 14, 3],
  service: [7],
};

type DueCat = 'mot' | 'tax' | 'insurance' | 'service';

const DUE_FIELDS: Record<DueCat, 'mot_due' | 'tax_due' | 'insurance_due' | 'service_due'> = {
  mot: 'mot_due',
  tax: 'tax_due',
  insurance: 'insurance_due',
  service: 'service_due',
};

function severity(daysAway: number): 'info' | 'warning' | 'error' {
  if (daysAway <= 1) return 'error';
  if (daysAway <= 7) return 'warning';
  return 'info';
}

function processVehicleCat(
  v: Vehicle,
  cat: DueCat,
  now: Date,
  activeTypes: Set<string>,
  alertRepo: AlertRepository,
): number {
  // Bicycles skip mot/tax/insurance
  if (v.type === 'bicycle' && cat !== 'service') return 0;

  const dueMs = v[DUE_FIELDS[cat]];
  if (!dueMs) return 0;

  const daysAway = Math.ceil((dueMs - now.getTime()) / 86_400_000);
  const overrides = v.reminder_overrides_json ?? {};
  const windows: number[] = overrides[cat] ?? DEFAULT_WINDOWS[cat] ?? [];

  if (!windows.includes(daysAway)) return 0;

  const alertType = `vehicle_${cat}_${v.id}_${daysAway}d`;
  if (activeTypes.has(alertType)) return 0;

  alertRepo.create({
    type: alertType,
    severity: severity(daysAway),
    message: `${v.nickname}: ${cat.toUpperCase()} due in ${daysAway} day${daysAway === 1 ? '' : 's'}`,
    deep_link: `/vehicles/${v.id}`,
  });
  return 1;
}

function processMileageReminder(
  v: Vehicle,
  now: Date,
  activeTypes: Set<string>,
  alertRepo: AlertRepository,
): number {
  if (v.service_due_mileage === null || v.current_mileage === null) return 0;
  if (v.service_due_mileage - v.current_mileage > 500) return 0;

  const dayBucket = Math.floor(now.getTime() / 86_400_000);
  const dedupType = `vehicle_service_mileage_${v.id}_${dayBucket}`;
  if (activeTypes.has(dedupType)) return 0;

  alertRepo.create({
    type: dedupType,
    severity: 'warning',
    message: `${v.nickname}: service due within 500 miles (${v.service_due_mileage - v.current_mileage} mi remaining)`,
    deep_link: `/vehicles/${v.id}`,
  });
  return 1;
}

const CATS: DueCat[] = ['mot', 'tax', 'insurance', 'service'];

export default function evaluateReminders(
  vehicleRepo: VehicleRepository,
  alertRepo: AlertRepository,
  now: Date = new Date(),
): Promise<{ pushed: number }> {
  const vehicles = vehicleRepo.list(false); // active only
  const activeAlerts = alertRepo.listActive();
  const activeTypes = new Set(activeAlerts.map((a) => a.type));

  const pushed = vehicles.reduce((total, v) => {
    const catPushed = CATS.reduce(
      (sum, cat) => sum + processVehicleCat(v, cat, now, activeTypes, alertRepo),
      0,
    );
    const milagePushed = processMileageReminder(v, now, activeTypes, alertRepo);
    return total + catPushed + milagePushed;
  }, 0);

  return Promise.resolve({ pushed });
}
