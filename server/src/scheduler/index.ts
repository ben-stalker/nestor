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
import { getDb } from '../db/connection';

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

  Scheduler.register('reminder-eval', '5 0 * * *', () => {
    logger.debug({ job: 'reminder-eval' }, 'placeholder — reminder evaluation not yet implemented');
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
}
