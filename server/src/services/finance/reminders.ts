import type FinanceRepository from '../../repositories/FinanceRepository';
import type AlertRepository from '../../repositories/AlertRepository';

const FIXED_RATE_WINDOWS = [180, 90, 30, 14, 7, 1];

function severity(daysAway: number): 'info' | 'warning' | 'error' {
  if (daysAway <= 1) return 'error';
  if (daysAway <= 14) return 'warning';
  return 'info';
}

function alertWindows(alertMonthsBefore: number): number[] {
  const primary = Math.round(alertMonthsBefore * 30);
  const base = [primary, 30, 14, 7, 1];
  return [...new Set(base.filter((d) => d <= primary))];
}

export default function evaluateFinanceReminders(
  financeRepo: FinanceRepository,
  alertRepo: AlertRepository,
  now: Date = new Date(),
): Promise<{ pushed: number }> {
  const agreements = financeRepo.listAgreements(true);
  const activeAlerts = alertRepo.listActive();
  const activeTypes = new Set(activeAlerts.map((a) => a.type));

  const pushed = agreements.reduce((total, a) => {
    const windows = alertWindows(a.alert_months_before);
    let count = 0;

    if (a.end_date) {
      const daysAway = Math.ceil((a.end_date - now.getTime()) / 86_400_000);
      if (windows.includes(daysAway)) {
        const alertType = `finance_end_${a.id}_${daysAway}d`;
        if (!activeTypes.has(alertType)) {
          alertRepo.create({
            type: alertType,
            severity: severity(daysAway),
            message: `${a.name}: agreement ends in ${daysAway} day${daysAway === 1 ? '' : 's'}`,
            deep_link: '/finance',
          });
          count += 1;
        }
      }
    }

    if (a.fixed_rate_end_date) {
      const daysAway = Math.ceil((a.fixed_rate_end_date - now.getTime()) / 86_400_000);
      if (FIXED_RATE_WINDOWS.includes(daysAway)) {
        const alertType = `finance_fixed_rate_${a.id}_${daysAway}d`;
        if (!activeTypes.has(alertType)) {
          alertRepo.create({
            type: alertType,
            severity: severity(daysAway),
            message: `${a.name}: fixed rate ends in ${daysAway} day${daysAway === 1 ? '' : 's'}`,
            deep_link: '/finance',
          });
          count += 1;
        }
      }
    }

    return total + count;
  }, 0);

  return Promise.resolve({ pushed });
}
