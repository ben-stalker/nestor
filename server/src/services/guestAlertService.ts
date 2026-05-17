import type AlertRepository from '../repositories/AlertRepository';
import type ChecklistRepository from '../repositories/ChecklistRepository';

const ALERT_DAYS_BEFORE = [7, 3, 1];

export default function evaluateGuestAlerts(
  checklistRepo: ChecklistRepository,
  alertRepo: AlertRepository,
): void {
  const now = Date.now();
  const activeAlerts = alertRepo.listActive();

  checklistRepo
    .list()
    .filter((c) => c.guest_name != null && c.guest_arrival_date != null)
    .forEach((checklist) => {
      if (!checklist.guest_arrival_date) return;

      const daysUntil = Math.ceil((checklist.guest_arrival_date - now) / (1000 * 60 * 60 * 24));
      if (!ALERT_DAYS_BEFORE.includes(daysUntil)) return;

      const items = checklistRepo.listItems(checklist.id);
      const incomplete = items.filter((i) => !i.ticked);
      if (incomplete.length === 0) return;

      const alertKey = `guest_checklist:${checklist.id}:${daysUntil}d`;
      const alreadyExists = activeAlerts.some(
        (a) => a.type === 'guest_arrival' && a.message.includes(alertKey),
      );
      if (alreadyExists) return;

      alertRepo.create({
        type: 'guest_arrival',
        severity: daysUntil === 1 ? 'error' : 'warning',
        message: `[${alertKey}] ${checklist.guest_name ?? 'Guest'} arrives in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — ${incomplete.length} checklist item${incomplete.length === 1 ? '' : 's'} remaining`,
        deep_link: '/board',
      });
    });
}
