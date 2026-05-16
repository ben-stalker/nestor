import { schedule, validate } from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import logger from '../utils/logger';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import { LocationSchema } from '../db/settings-keys';
import * as WeatherService from '../services/WeatherService';
import CalendarAccountRepository from '../repositories/CalendarAccountRepository';
import EventRepository from '../repositories/EventRepository';
import ProfileRepository from '../repositories/ProfileRepository';
import AlertRepository from '../repositories/AlertRepository';
import CalendarService from '../services/CalendarService';
import { TermDatesService } from '../services/TermDatesService';
import VehicleRepository from '../repositories/VehicleRepository';
import FinanceRepository from '../repositories/FinanceRepository';
import evaluateReminders from '../services/vehicles/reminders';
import evaluateFinanceReminders from '../services/finance/reminders';
import { getDb } from '../db/connection';
import BinScheduleRepository from '../repositories/BinScheduleRepository';
import ChecklistRepository from '../repositories/ChecklistRepository';
import evaluateBinAlerts from '../services/binAlertService';
import HealthLogRepository from '../repositories/HealthLogRepository';
import evalFeedAlerts from '../services/babyAlertService';
import { evalVaccinationAlerts } from '../services/VaccinationService';
import PetRepository from '../repositories/PetRepository';
import PetHealthLogRepository from '../repositories/PetHealthLogRepository';
import evaluatePetAlerts from '../services/petAlertService';

export type JobHandler = () => void | Promise<void>;

export interface JobInfo {
  name: string;
  cron: string;
  runCount: number;
  lastRun?: number;
  lastError?: string;
}

interface JobEntry extends JobInfo {
  handler: JobHandler;
  task: ScheduledTask;
}

export class Scheduler {
  private static jobs = new Map<string, JobEntry>();

  static register(name: string, cron: string, handler: JobHandler): void {
    if (!validate(cron)) {
      throw new Error(`Invalid cron expression for job "${name}": ${cron}`);
    }

    const wrapped = async (): Promise<void> => {
      const entry = this.jobs.get(name);
      if (!entry) return;
      entry.runCount += 1;
      entry.lastRun = Date.now();
      try {
        await handler();
        entry.lastError = undefined;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        entry.lastError = message;
        logger.error({ err, job: name }, 'Scheduled job threw');
      }
    };

    const task = schedule(cron, wrapped, { name });
    this.jobs.set(name, { name, cron, handler, task, runCount: 0 });
    logger.info({ job: name, cron }, 'Job registered');
  }

  static async runNow(name: string): Promise<void> {
    const entry = this.jobs.get(name);
    if (!entry) throw new Error(`No such job: "${name}"`);
    entry.runCount += 1;
    entry.lastRun = Date.now();
    try {
      await entry.handler();
      entry.lastError = undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      entry.lastError = message;
      logger.error({ err, job: name }, 'Scheduled job threw');
    }
  }

  static list(): JobInfo[] {
    return Array.from(this.jobs.values()).map(({ handler: _, task: __, ...info }) => info);
  }

  static stop(): void {
    this.jobs.forEach(({ task }) => {
      void task.stop();
    });
    this.jobs.clear();
  }

  static clearRegistry(): void {
    this.jobs.clear();
  }
}

export function registerBuiltinJobs(settingsRepo?: AppSettingsRepository): void {
  Scheduler.register('weather-refresh', '*/30 * * * *', async () => {
    const raw = settingsRepo?.get('location');
    if (!raw) {
      logger.debug({ job: 'weather-refresh' }, 'No location configured — skipping weather refresh');
      return;
    }
    const parsed = LocationSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn(
        { job: 'weather-refresh' },
        'Invalid location setting — skipping weather refresh',
      );
      return;
    }
    await WeatherService.refresh(parsed.data.lat, parsed.data.lon);
  });

  Scheduler.register('caldav-sync', '*/15 * * * *', async () => {
    const db = getDb();
    const calendarService = new CalendarService(
      new CalendarAccountRepository(db),
      new EventRepository(db),
    );
    await calendarService.syncAllAccounts();
  });

  Scheduler.register('reminder-eval', '5 0 * * *', async () => {
    const db = getDb();
    const alertRepo = new AlertRepository(db);
    const profileRepo = new ProfileRepository(db);
    await evaluateReminders(new VehicleRepository(db), alertRepo);
    await evaluateFinanceReminders(new FinanceRepository(db), alertRepo);
    evalFeedAlerts(profileRepo, new HealthLogRepository(db), alertRepo);
    evalVaccinationAlerts(profileRepo, new HealthLogRepository(db), alertRepo);
    evaluatePetAlerts(new PetRepository(db), new PetHealthLogRepository(db), alertRepo);
  });

  Scheduler.register('github-update-poll', '0 3 * * *', () => {
    logger.debug(
      { job: 'github-update-poll' },
      'placeholder — GitHub releases poll not yet implemented',
    );
  });

  Scheduler.register('vacuum-db', '0 3 * * 0', () => {
    logger.debug({ job: 'vacuum-db' }, 'placeholder — weekly VACUUM not yet implemented');
  });

  Scheduler.register('term-dates-sync', '0 2 * * *', async () => {
    const db = getDb();
    const termDatesService = new TermDatesService(
      new ProfileRepository(db),
      new EventRepository(db),
      new AlertRepository(db),
    );
    await termDatesService.syncAll();
  });

  Scheduler.register('bin-alert-eval', '0 7,18 * * *', () => {
    const db = getDb();
    evaluateBinAlerts(new BinScheduleRepository(db), new AlertRepository(db));
  });

  Scheduler.register('checklist-reset', '0 3 * * *', () => {
    const db = getDb();
    new ChecklistRepository(db).resetDailyChecklists();
  });
}
