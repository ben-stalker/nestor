import BaseRepository from './BaseRepository';
import { encrypt as defaultEncrypt, decrypt as defaultDecrypt } from '../utils/crypto';
import logger from '../utils/logger';

interface SettingRow {
  plugin_id: string;
  key: string;
  value_encrypted: string;
}

export interface PluginSettingsCryptoFns {
  encrypt: (plaintext: string) => string;
  decrypt: (ciphertext: string) => string;
}

class PluginSettingsRepository extends BaseRepository {
  private readonly encryptFn: (plaintext: string) => string;

  private readonly decryptFn: (ciphertext: string) => string;

  constructor(
    db: import('better-sqlite3').Database,
    cryptoFns: PluginSettingsCryptoFns = { encrypt: defaultEncrypt, decrypt: defaultDecrypt },
  ) {
    super(db);
    this.encryptFn = cryptoFns.encrypt;
    this.decryptFn = cryptoFns.decrypt;
  }

  get(pluginId: string, key: string): string | undefined {
    const row = this.queryOne<SettingRow>(
      'SELECT plugin_id, key, value_encrypted FROM plugin_settings WHERE plugin_id = ? AND key = ?',
      [pluginId, key],
    );
    if (!row) return undefined;
    try {
      return this.decryptFn(row.value_encrypted);
    } catch (err) {
      logger.warn({ err, pluginId, key }, 'PluginSettingsRepository: decrypt failed');
      return undefined;
    }
  }

  set(pluginId: string, key: string, value: string): void {
    const ciphertext = this.encryptFn(value);
    this.run(
      `INSERT INTO plugin_settings (plugin_id, key, value_encrypted, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(plugin_id, key) DO UPDATE SET
         value_encrypted = excluded.value_encrypted,
         updated_at = excluded.updated_at`,
      [pluginId, key, ciphertext, new Date().toISOString()],
    );
  }

  delete(pluginId: string, key: string): boolean {
    const result = this.run('DELETE FROM plugin_settings WHERE plugin_id = ? AND key = ?', [
      pluginId,
      key,
    ]);
    return result.changes > 0;
  }

  deleteAll(pluginId: string): number {
    const result = this.run('DELETE FROM plugin_settings WHERE plugin_id = ?', [pluginId]);
    return result.changes;
  }

  listKeys(pluginId: string): string[] {
    const rows = this.all<{ key: string }>(
      'SELECT key FROM plugin_settings WHERE plugin_id = ? ORDER BY key',
      [pluginId],
    );
    return rows.map((r) => r.key);
  }

  getAll(pluginId: string): Record<string, string> {
    const rows = this.all<SettingRow>(
      'SELECT plugin_id, key, value_encrypted FROM plugin_settings WHERE plugin_id = ?',
      [pluginId],
    );
    const out: Record<string, string> = {};
    rows.forEach((r) => {
      try {
        out[r.key] = this.decryptFn(r.value_encrypted);
      } catch (err) {
        logger.warn({ err, pluginId, key: r.key }, 'PluginSettingsRepository: decrypt failed');
      }
    });
    return out;
  }
}

export default PluginSettingsRepository;
