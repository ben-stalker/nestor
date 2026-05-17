import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import PluginSettingsRepository from '../../src/repositories/PluginSettingsRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeRepo(): { db: Database.Database; repo: PluginSettingsRepository } {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  const repo = new PluginSettingsRepository(db, {
    encrypt: (s) => `enc(${s})`,
    decrypt: (s) => (s.startsWith('enc(') ? s.slice(4, -1) : ''),
  });
  return { db, repo };
}

describe('PluginSettingsRepository', () => {
  it('returns undefined for missing key', () => {
    const { db, repo } = makeRepo();
    expect(repo.get('tesla', 'access_token')).toBeUndefined();
    db.close();
  });

  it('stores and retrieves an encrypted value', () => {
    const { db, repo } = makeRepo();
    repo.set('tesla', 'access_token', 'secret-abc');
    expect(repo.get('tesla', 'access_token')).toBe('secret-abc');
    db.close();
  });

  it('overwrites existing key on conflict', () => {
    const { db, repo } = makeRepo();
    repo.set('tesla', 'access_token', 'one');
    repo.set('tesla', 'access_token', 'two');
    expect(repo.get('tesla', 'access_token')).toBe('two');
    db.close();
  });

  it('isolates keys per plugin id', () => {
    const { db, repo } = makeRepo();
    repo.set('tesla', 'shared_key', 'tesla_val');
    repo.set('eufy', 'shared_key', 'eufy_val');
    expect(repo.get('tesla', 'shared_key')).toBe('tesla_val');
    expect(repo.get('eufy', 'shared_key')).toBe('eufy_val');
    db.close();
  });

  it('returns all settings for a plugin', () => {
    const { db, repo } = makeRepo();
    repo.set('eufy', 'username', 'me');
    repo.set('eufy', 'password', 'p4ss');
    const all = repo.getAll('eufy');
    expect(all).toEqual({ username: 'me', password: 'p4ss' });
    db.close();
  });

  it('deletes a single key', () => {
    const { db, repo } = makeRepo();
    repo.set('eufy', 'password', 'p4ss');
    expect(repo.delete('eufy', 'password')).toBe(true);
    expect(repo.get('eufy', 'password')).toBeUndefined();
    db.close();
  });

  it('deleteAll removes all settings for a plugin', () => {
    const { db, repo } = makeRepo();
    repo.set('eufy', 'username', 'me');
    repo.set('eufy', 'password', 'p4ss');
    repo.set('tesla', 'access_token', 'x');
    const count = repo.deleteAll('eufy');
    expect(count).toBe(2);
    expect(repo.listKeys('eufy')).toEqual([]);
    expect(repo.get('tesla', 'access_token')).toBe('x');
    db.close();
  });

  it('listKeys returns sorted keys', () => {
    const { db, repo } = makeRepo();
    repo.set('tesla', 'zebra', '1');
    repo.set('tesla', 'apple', '2');
    repo.set('tesla', 'mango', '3');
    expect(repo.listKeys('tesla')).toEqual(['apple', 'mango', 'zebra']);
    db.close();
  });

  it('gracefully handles decrypt failure for one key', () => {
    const db = new Database(':memory:');
    runMigrations(db, MIGRATIONS_DIR);
    const repo = new PluginSettingsRepository(db, {
      encrypt: (s) => s,
      decrypt: (s) => {
        if (s === 'bad') throw new Error('boom');
        return s;
      },
    });
    repo.set('tesla', 'good', 'ok');
    db.prepare(
      'INSERT INTO plugin_settings (plugin_id, key, value_encrypted, updated_at) VALUES (?, ?, ?, ?)',
    ).run('tesla', 'bad', 'bad', new Date().toISOString());
    const all = repo.getAll('tesla');
    expect(all).toEqual({ good: 'ok' });
    expect(repo.get('tesla', 'bad')).toBeUndefined();
    db.close();
  });
});
