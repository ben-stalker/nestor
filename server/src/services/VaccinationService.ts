import type HealthLogRepository from '../repositories/HealthLogRepository';
import type AlertRepository from '../repositories/AlertRepository';
import type ProfileRepository from '../repositories/ProfileRepository';
import nhsSchedule from '../data/nhsVaccinations.js';

export interface VaccinationItem {
  id: string;
  name: string;
  age_weeks: number;
  description: string;
  dueAt: number;
  completed: boolean;
  completed_at: number | null;
}

export function getScheduleForBaby(dob: number, completedNames: string[]): VaccinationItem[] {
  return nhsSchedule.map((v) => ({
    ...v,
    dueAt: dob + v.age_weeks * 7 * 86_400_000,
    completed: completedNames.includes(v.name),
    completed_at: null,
  }));
}

export function evalVaccinationAlerts(
  profileRepo: ProfileRepository,
  healthRepo: HealthLogRepository,
  alertRepo: AlertRepository,
): void {
  const babies = profileRepo.list().filter((p) => p.type === 'baby' && p.dob !== null);

  babies.forEach((baby) => {
    const dob = baby.dob!;
    const vaccinationLogs = healthRepo.listForProfile(baby.id, {
      logType: 'vaccination',
      limit: 200,
    });
    const completedNames = vaccinationLogs.map((e) => String(e.data_json.name ?? ''));
    const schedule = getScheduleForBaby(dob, completedNames);

    schedule.forEach((item) => {
      if (!item.completed) {
        const now = Date.now();
        const daysUntil = Math.ceil((item.dueAt - now) / 86_400_000);
        const shouldAlert = daysUntil <= 14 && daysUntil >= 0;
        const overdue = daysUntil < 0 && daysUntil >= -30;

        if (shouldAlert || overdue) {
          const alertType = `vaccination_due_${baby.id}_${item.id}`;
          const existing = alertRepo.listActive().find((a) => a.type === alertType);
          if (!existing) {
            const msg = overdue
              ? `${baby.name}: ${item.name} was due ${Math.abs(daysUntil)} days ago`
              : `${baby.name}: ${item.name} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
            alertRepo.create({
              type: alertType,
              severity: overdue ? 'warning' : 'info',
              message: msg,
              deep_link: '/family',
              profile_id: baby.id,
            });
          }
        }
      }
    });
  });
}
