import type PetRepository from '../repositories/PetRepository';
import type PetHealthLogRepository from '../repositories/PetHealthLogRepository';
import type AlertRepository from '../repositories/AlertRepository';

export default function evaluatePetAlerts(
  petRepo: PetRepository,
  petHealthRepo: PetHealthLogRepository,
  alertRepo: AlertRepository,
): void {
  const now = new Date();
  const pets = petRepo.list();

  pets.forEach((pet) => {
    const logs = petHealthRepo.listForPet(pet.id);
    logs.forEach((log) => {
      if (!log.next_due_date) return;
      const dueDate = new Date(log.next_due_date);
      const daysUntil = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const threshold = log.reminder_days_before ?? 7;
      if (daysUntil < 0 || daysUntil > threshold) return;

      const alertKey = `pet_care:${log.id}:${log.next_due_date}`;
      const existing = alertRepo.listActive().some(
        (a) => a.type === 'pet_care' && a.message.includes(alertKey),
      );
      if (existing) return;

      let dueLabel: string;
      if (daysUntil === 0) {
        dueLabel = 'today';
      } else if (daysUntil === 1) {
        dueLabel = 'tomorrow';
      } else {
        dueLabel = `in ${daysUntil} days`;
      }
      alertRepo.create({
        type: 'pet_care',
        severity: 'warning',
        message: `[${alertKey}] ${pet.name}: ${log.title} due ${dueLabel}`,
        deep_link: '/pets',
      });
    });
  });
}
