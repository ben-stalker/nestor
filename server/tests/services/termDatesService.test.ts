import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import EventRepository from '../../src/repositories/EventRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import { initCrypto } from '../../src/utils/crypto';
import { TermDatesService } from '../../src/services/TermDatesService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

const MINIMAL_ICAL = (uid: string, summary: string, dtstart: string) => `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:${uid}
SUMMARY:${summary}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtstart}
END:VEVENT
END:VCALENDAR`;

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

describe('TermDatesService', () => {
  let db: Database.Database;
  let profileRepo: ProfileRepository;
  let eventRepo: EventRepository;
  let alertRepo: AlertRepository;
  let service: TermDatesService;

  beforeEach(() => {
    db = makeDb();
    profileRepo = new ProfileRepository(db);
    eventRepo = new EventRepository(db);
    alertRepo = new AlertRepository(db);
    service = new TermDatesService(profileRepo, eventRepo, alertRepo);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips profiles without term_dates_ical_url', async () => {
    const profile = profileRepo.create({
      name: 'Tommy',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: {},
    });

    // No URL set on profile
    await service.syncProfile(profile);

    const events = eventRepo.findInRange(0, Date.now() + 10_000_000_000);
    expect(events).toHaveLength(0);
  });

  it('parses VEVENT components and creates events with type=school_term', async () => {
    const icalText = MINIMAL_ICAL('test-uid-001', 'Autumn Term', '20261005');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(icalText),
    });

    let profile = profileRepo.create({
      name: 'Tommy',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: {},
    });
    profile = profileRepo.update(profile.id, {
      term_dates_ical_url: 'https://example.com/terms.ics',
    });

    await service.syncProfile(profile);

    // Search well into the future to cover the test date (2026-10-05)
    const events = eventRepo.findInRange(0, Date.now() + 100_000_000_000);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Autumn Term');
    expect(events[0].type).toBe('school_term');
    expect(events[0].profile_id).toBe(profile.id);
  });

  it('creates an alert for inset day events', async () => {
    const icalText = MINIMAL_ICAL('test-uid-002', 'Inset Day', '20261005');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(icalText),
    });

    let profile = profileRepo.create({
      name: 'Tommy',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: {},
    });
    profile = profileRepo.update(profile.id, {
      term_dates_ical_url: 'https://example.com/terms.ics',
    });

    await service.syncProfile(profile);

    const alerts = alertRepo.listActive();
    expect(alerts.some((a) => /inset/i.test(a.message))).toBe(true);
  });

  it('does not duplicate alerts on second sync', async () => {
    const icalText = MINIMAL_ICAL('test-uid-003', 'INSET DAY', '20261005');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(icalText),
    });

    let profile = profileRepo.create({
      name: 'Tommy',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: {},
    });
    profile = profileRepo.update(profile.id, {
      term_dates_ical_url: 'https://example.com/terms.ics',
    });

    await service.syncProfile(profile);
    await service.syncProfile(profile);

    const alerts = alertRepo.listActive();
    const insetAlerts = alerts.filter((a) => /inset/i.test(a.message));
    expect(insetAlerts).toHaveLength(1);
  });

  it('handles fetch failure gracefully without throwing', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    let profile = profileRepo.create({
      name: 'Tommy',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: {},
    });
    profile = profileRepo.update(profile.id, {
      term_dates_ical_url: 'https://example.com/terms.ics',
    });

    await expect(service.syncProfile(profile)).resolves.not.toThrow();
  });

  it('syncAll only syncs child-type profiles with URL set', async () => {
    const icalText = MINIMAL_ICAL('test-uid-004', 'Spring Term', '20270303');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(icalText),
    });

    // Admin profile should not be synced
    profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#000000',
      permissions_json: {},
    });

    const child = profileRepo.create({
      name: 'Tommy',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: {},
    });
    profileRepo.update(child.id, {
      term_dates_ical_url: 'https://example.com/terms.ics',
    });

    await service.syncAll();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
