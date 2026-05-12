import eventBus from '../core/eventBus';
import logger from '../utils/logger';
import CalendarAccountRepository from '../repositories/CalendarAccountRepository';
import EventRepository from '../repositories/EventRepository';
import { getProvider } from './calendar/providerRegistry';
import type { RawEvent } from './calendar/CalendarProvider';

export default class CalendarService {
  constructor(
    private readonly accountRepo: CalendarAccountRepository,
    private readonly eventRepo: EventRepository,
  ) {}

  async syncAccount(accountId: number): Promise<void> {
    const account = this.accountRepo.get(accountId);
    if (!account) {
      logger.warn({ accountId }, 'CalendarService.syncAccount: account not found');
      return;
    }

    if (!account.active) {
      logger.debug({ accountId }, 'CalendarService.syncAccount: account inactive, skipping');
      return;
    }

    const provider = getProvider(account.provider);

    try {
      const rawEvents: RawEvent[] = await provider.pull(account);

      rawEvents.forEach((raw) => {
        this.eventRepo.upsertByCaldavUid(accountId, raw.caldav_uid, {
          title: raw.title,
          start_datetime: raw.start_datetime,
          end_datetime: raw.end_datetime,
          all_day: raw.all_day ?? false,
          type: 'default',
          recurring_rule: raw.recurring_rule,
          notes: raw.notes,
          caldav_etag: raw.caldav_etag,
        });
      });

      this.accountRepo.markSynced(accountId);
      eventBus.emit('calendar:synced', { accountId, eventCount: rawEvents.length });
      logger.info({ accountId, eventCount: rawEvents.length }, 'CalDAV sync complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.accountRepo.markSynced(accountId, message);
      logger.error({ err, accountId }, 'CalDAV sync failed');
    }
  }

  async syncAllAccounts(): Promise<void> {
    const accounts = this.accountRepo.listActive();
    await Promise.allSettled(accounts.map((a) => this.syncAccount(a.id)));
  }
}
