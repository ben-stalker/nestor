import logger from '../utils/logger';
import { SETTING_SCHEMAS } from '../db/settings-keys';
import BaseRepository from './BaseRepository';

interface SettingRow {
  key: string;
  value: string;
}

class AppSettingsRepository extends BaseRepository {
  private cache: Record<string, unknown> | null = null;

  getAll(): Record<string, unknown> {
    if (this.cache !== null) return this.cache;

    const rows = this.all<SettingRow>('SELECT key, value FROM app_settings');
    const result: Record<string, unknown> = {};
    rows.forEach((row) => {
      result[row.key] = JSON.parse(row.value) as unknown;
    });
    this.cache = result;
    return this.cache;
  }

  get<T>(key: string): T | undefined {
    return this.getAll()[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    if (!(key in SETTING_SCHEMAS)) {
      logger.warn({ key }, 'Unknown app_settings key written');
    }
    this.run(
      'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
      [key, JSON.stringify(value), Date.now()],
    );
    this.cache = null;
    // TODO: emit settings:updated event on event bus (STORY-1.9)
  }

  setMany(map: Record<string, unknown>): void {
    this.db.transaction(() => {
      Object.entries(map).forEach(([key, value]) => {
        this.set(key, value);
      });
    })();
  }

  delete(key: string): void {
    this.run('DELETE FROM app_settings WHERE key = ?', [key]);
    this.cache = null;
    // TODO: emit settings:updated event on event bus (STORY-1.9)
  }
}

export default AppSettingsRepository;
