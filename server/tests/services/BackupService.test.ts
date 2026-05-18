import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { BackupService, BACKUP_SCHEMA_VERSION } from '../../src/services/BackupService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

describe('BackupService', () => {
  let db: Database.Database;
  let settingsRepo: AppSettingsRepository;

  beforeEach(() => {
    db = makeDb();
    settingsRepo = new AppSettingsRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('exportAll', () => {
    it('returns expected shape with schema_version 1', () => {
      const result = BackupService.exportAll(db);

      expect(result.schema_version).toBe(BACKUP_SCHEMA_VERSION);
      expect(result.schema_version).toBe(1);
      expect(typeof result.exported_at).toBe('string');
      expect(new Date(result.exported_at).toISOString()).toBe(result.exported_at);
      expect(typeof result.tables).toBe('object');
      expect(Array.isArray(result.photos)).toBe(true);
    });

    it('includes all user tables in export', () => {
      const result = BackupService.exportAll(db);
      expect(result.tables).toHaveProperty('app_settings');
    });

    it('exports settings rows correctly', () => {
      settingsRepo.set('language', 'en');
      const result = BackupService.exportAll(db);

      const rows = result.tables.app_settings as Array<{ key: string; value: string }>;
      const langRow = rows.find((r) => r.key === 'language');
      expect(langRow).toBeDefined();
      expect(langRow?.value).toBe(JSON.stringify('en'));
    });

    it('returns empty array for tables with no rows', () => {
      const result = BackupService.exportAll(db);
      // journeys table should be empty in a fresh DB
      expect(Array.isArray(result.tables.journeys)).toBe(true);
      expect(result.tables.journeys.length).toBe(0);
    });
  });

  describe('importAll', () => {
    it('round-trips data correctly', () => {
      settingsRepo.set('language', 'de');
      settingsRepo.set('locale', 'de-DE');

      const backup = BackupService.exportAll(db);

      // Wipe and re-import
      settingsRepo.set('language', 'fr');
      BackupService.importAll(db, backup);

      expect(settingsRepo.get('language')).toBe('de');
      expect(settingsRepo.get('locale')).toBe('de-DE');
    });

    it('clears existing rows before importing', () => {
      settingsRepo.set('language', 'en');
      const backup = BackupService.exportAll(db);

      // Add more rows after snapshot
      settingsRepo.set('locale', 'en-GB');

      // Import should restore to snapshot state (no locale key)
      BackupService.importAll(db, backup);

      const all = settingsRepo.getAll();
      expect(all).toHaveProperty('language', 'en');
      expect(all).not.toHaveProperty('locale');
    });

    it('rejects wrong schema_version', () => {
      const badPayload = {
        schema_version: 2,
        exported_at: new Date().toISOString(),
        tables: {},
        photos: [],
      };

      expect(() => BackupService.importAll(db, badPayload)).toThrow();
    });

    it('rejects non-object payload', () => {
      expect(() => BackupService.importAll(db, null)).toThrow();
      expect(() => BackupService.importAll(db, 'not an object')).toThrow();
      expect(() => BackupService.importAll(db, 42)).toThrow();
    });

    it('rejects payload with missing schema_version', () => {
      const badPayload = {
        exported_at: new Date().toISOString(),
        tables: {},
        photos: [],
      };

      expect(() => BackupService.importAll(db, badPayload)).toThrow();
    });

    it('handles empty tables gracefully', () => {
      const backup = BackupService.exportAll(db);
      // Clear all tables content from backup to simulate empty import
      const emptyBackup = { ...backup, tables: { app_settings: [] } };

      expect(() => BackupService.importAll(db, emptyBackup)).not.toThrow();
    });
  });
});
