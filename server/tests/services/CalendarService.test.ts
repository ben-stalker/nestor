import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import CalendarAccountRepository from '../../src/repositories/CalendarAccountRepository';
import EventRepository from '../../src/repositories/EventRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import CalendarService from '../../src/services/CalendarService';
import { registerProvider, clearProviders } from '../../src/services/calendar/providerRegistry';
import type { CalendarProvider, RawEvent } from '../../src/services/calendar/CalendarProvider';
import eventBus from '../../src/core/eventBus';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

const NOW = 1_700_000_000_000;
const HOUR = 3_600_000;

function makePullFn(events: RawEvent[], throws?: Error): jest.Mock {
  return throws ? jest.fn().mockRejectedValue(throws) : jest.fn().mockResolvedValue(events);
}

function makeProvider(pullFn: jest.Mock): CalendarProvider {
  return {
    pull: pullFn,
    push: jest.fn().mockResolvedValue(undefined),
    testCredentials: jest.fn().mockResolvedValue(true),
  };
}

function makeRawEvent(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    caldav_uid: 'uid-001',
    title: 'CalDAV Event',
    start_datetime: NOW,
    end_datetime: NOW + HOUR,
    ...overrides,
  };
}

describe('CalendarService', () => {
  let db: Database.Database;
  let accountRepo: CalendarAccountRepository;
  let eventRepo: EventRepository;
  let service: CalendarService;

  beforeEach(() => {
    db = makeDb();
    accountRepo = new CalendarAccountRepository(db);
    eventRepo = new EventRepository(db);
    service = new CalendarService(accountRepo, eventRepo);
    clearProviders();
  });

  afterEach(() => {
    db.close();
  });

  describe('syncAccount', () => {
    it('registered provider is invoked on syncAccount', async () => {
      const pullFn = makePullFn([makeRawEvent()]);
      registerProvider('custom', makeProvider(pullFn));
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'Test',
        credentials: {},
      });

      await service.syncAccount(account.id);

      expect(pullFn).toHaveBeenCalledWith(expect.objectContaining({ id: account.id }));
    });

    it('events are upserted by caldav_uid (no duplicates on second sync)', async () => {
      const pullFn1 = makePullFn([makeRawEvent({ caldav_uid: 'uid-001', title: 'V1' })]);
      registerProvider('custom', makeProvider(pullFn1));
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });

      await service.syncAccount(account.id);

      const pullFn2 = makePullFn([makeRawEvent({ caldav_uid: 'uid-001', title: 'V2' })]);
      registerProvider('custom', makeProvider(pullFn2));
      await service.syncAccount(account.id);

      const events = eventRepo.findInRange(NOW - HOUR, NOW + 2 * HOUR);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('V2');
    });

    it('provider throw → markSynced records error', async () => {
      const pullFn = makePullFn([], new Error('connection refused'));
      registerProvider('custom', makeProvider(pullFn));
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });

      await service.syncAccount(account.id);

      const updated = accountRepo.get(account.id);
      expect(updated?.last_sync_error).toBe('connection refused');
    });

    it('success emits calendar:synced event', async () => {
      const pullFn = makePullFn([]);
      registerProvider('custom', makeProvider(pullFn));
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });

      const listener = jest.fn();
      eventBus.on('calendar:synced', listener);
      await service.syncAccount(account.id);
      eventBus.off('calendar:synced', listener);

      expect(listener).toHaveBeenCalledWith({ accountId: account.id, eventCount: 0 });
    });

    it('success sets last_sync_at', async () => {
      registerProvider('custom', makeProvider(makePullFn([])));
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });

      await service.syncAccount(account.id);

      const updated = accountRepo.get(account.id);
      expect(updated?.last_sync_at).toBeGreaterThan(0);
      expect(updated?.last_sync_error).toBeNull();
    });

    it('LocalProvider fallback returns [] without error', async () => {
      const account = accountRepo.create({
        provider: 'google',
        display_name: 'G',
        credentials: {},
      });
      await expect(service.syncAccount(account.id)).resolves.not.toThrow();
      const events = eventRepo.findInRange(0, Number.MAX_SAFE_INTEGER);
      expect(events).toHaveLength(0);
    });

    it('skips inactive account', async () => {
      const pullFn = makePullFn([makeRawEvent()]);
      registerProvider('custom', makeProvider(pullFn));
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });
      accountRepo.update(account.id, { active: 0 });

      await service.syncAccount(account.id);

      expect(pullFn).not.toHaveBeenCalled();
    });
  });

  describe('syncAllAccounts', () => {
    it('continues if one account fails (Promise.allSettled)', async () => {
      const pullFn = makePullFn([], new Error('boom'));
      registerProvider('custom', makeProvider(pullFn));
      accountRepo.create({ provider: 'custom', display_name: 'A1', credentials: {} });
      accountRepo.create({ provider: 'custom', display_name: 'A2', credentials: {} });

      await expect(service.syncAllAccounts()).resolves.not.toThrow();
    });

    it('syncs all active accounts', async () => {
      const pullFn = makePullFn([makeRawEvent()]);
      registerProvider('custom', makeProvider(pullFn));

      accountRepo.create({ provider: 'custom', display_name: 'A1', credentials: {} });
      accountRepo.create({ provider: 'custom', display_name: 'A2', credentials: {} });

      await service.syncAllAccounts();
      expect(pullFn).toHaveBeenCalledTimes(2);
    });
  });
});
