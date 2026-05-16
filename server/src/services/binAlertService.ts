import type BinScheduleRepository from '../repositories/BinScheduleRepository';
import type AlertRepository from '../repositories/AlertRepository';
import { nextCollections } from './binSchedule';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTomorrow(d: Date, now: Date): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d, tomorrow);
}

export default function evaluateBinAlerts(
  binRepo: BinScheduleRepository,
  alertRepo: AlertRepository,
): void {
  const now = new Date();
  const bins = binRepo.list();

  const lookFrom = new Date(now);
  lookFrom.setDate(lookFrom.getDate() - 1);

  const existingAlerts = alertRepo.listActive();

  bins.forEach((bin) => {
    const collections = nextCollections(
      {
        day_of_week: bin.day_of_week,
        frequency_weeks: bin.frequency_weeks,
        anchor_date: bin.anchor_date,
        bank_holiday_shift: bin.bank_holiday_shift,
      },
      lookFrom,
      5,
    );

    collections.forEach((collectionDate) => {
      const isToday = isSameDay(collectionDate, now);
      const isTom = isTomorrow(collectionDate, now);

      if (!isToday && !isTom) return;
      if (isToday && !bin.reminder_morning_of) return;
      if (isTom && !bin.reminder_evening_before) return;

      const timing = isToday ? 'morning' : 'evening';
      const alertTypeKey = `bin_day:${bin.id}:${todayKey()}:${timing}`;
      const alreadyExists = existingAlerts.some(
        (a) => a.type === 'bin_day' && a.message.includes(alertTypeKey),
      );
      if (alreadyExists) return;

      const timeLabel = isToday ? 'today' : 'tomorrow';
      alertRepo.create({
        type: 'bin_day',
        severity: 'info',
        message: `[${alertTypeKey}] ${bin.name} bin collection is ${timeLabel}`,
        deep_link: '/house',
      });
    });
  });
}
