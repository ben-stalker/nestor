import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runMigrations } from '../../src/db/migrationRunner';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { CryptoService, getMachineId } from '../../src/utils/crypto';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeService(db: Database.Database): CryptoService {
  return new CryptoService(new AppSettingsRepository(db), () => 'test-machine-id-fixed');
}

// ─── CryptoService ───────────────────────────────────────────────────────────

describe('CryptoService', () => {
  let db: Database.Database;
  let service: CryptoService;

  beforeEach(() => {
    db = makeDb();
    service = makeService(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('round-trip', () => {
    it('decrypt(encrypt(x)) === x for a plain string', () => {
      expect(service.decrypt(service.encrypt('hello world'))).toBe('hello world');
    });

    it('round-trips an empty string', () => {
      expect(service.decrypt(service.encrypt(''))).toBe('');
    });

    it('round-trips unicode and emoji', () => {
      const msg = 'こんにちは 🔐';
      expect(service.decrypt(service.encrypt(msg))).toBe(msg);
    });
  });

  describe('output format', () => {
    it('ciphertext starts with "v1:"', () => {
      expect(service.encrypt('test')).toMatch(/^v1:/);
    });

    it('ciphertext has exactly 4 colon-delimited segments', () => {
      const parts = service.encrypt('test').split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('v1');
    });
  });

  describe('IV uniqueness', () => {
    it('100 encryptions of the same plaintext produce 100 distinct ciphertexts', () => {
      const results = new Set<string>();
      for (let i = 0; i < 100; i += 1) results.add(service.encrypt('same'));
      expect(results.size).toBe(100);
    });
  });

  describe('tamper detection', () => {
    function tamperPart(blob: string, partIndex: number): string {
      const parts = blob.split(':');
      const buf = Buffer.from(parts[partIndex], 'base64');
      // Flip one byte without bitwise operators
      buf[0] = (buf[0] + 1) % 256;
      parts[partIndex] = buf.toString('base64');
      return parts.join(':');
    }

    it('throws when ciphertext bytes are corrupted', () => {
      const blob = service.encrypt('secret');
      expect(() => service.decrypt(tamperPart(blob, 3))).toThrow();
    });

    it('throws when the GCM auth tag is corrupted', () => {
      const blob = service.encrypt('secret');
      expect(() => service.decrypt(tamperPart(blob, 2))).toThrow();
    });

    it('throws when IV is corrupted (tag mismatch)', () => {
      const blob = service.encrypt('secret');
      expect(() => service.decrypt(tamperPart(blob, 1))).toThrow();
    });
  });

  describe('version prefix validation', () => {
    it('decrypt("v0:…") throws "Unsupported ciphertext version"', () => {
      expect(() => service.decrypt('v0:aaa:bbb:ccc')).toThrow('Unsupported ciphertext version');
    });

    it('decrypt with no version prefix throws', () => {
      expect(() => service.decrypt('aaa:bbb:ccc:ddd')).toThrow('Unsupported ciphertext version');
    });
  });

  describe('salt management', () => {
    it('auto-generates a salt on first call and persists it to app_settings', () => {
      service.encrypt('trigger-key-derivation');

      // Fresh repo instance — no stale cache from a pre-read
      const repo = new AppSettingsRepository(db);
      const salt = repo.get<string>('encryption_salt');
      expect(typeof salt).toBe('string');
      expect((salt as string).length).toBeGreaterThan(0);
    });

    it('re-uses the same salt on subsequent calls (no re-write)', () => {
      const repo = new AppSettingsRepository(db);
      service.encrypt('first');
      const salt1 = repo.get<string>('encryption_salt');

      service.encrypt('second');
      const salt2 = repo.get<string>('encryption_salt');

      expect(salt1).toBe(salt2);
    });

    it('a new service instance with the same DB can decrypt what the first produced', () => {
      const blob = service.encrypt('hello');
      const service2 = makeService(db);
      expect(service2.decrypt(blob)).toBe('hello');
    });
  });
});

// ─── getMachineId ─────────────────────────────────────────────────────────────

describe('getMachineId', () => {
  const nestorPath = path.join(os.homedir(), '.nestor', 'machine-id');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads /etc/machine-id when available', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      if (String(p) === '/etc/machine-id') return 'system-machine-id\n';
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    expect(getMachineId()).toBe('system-machine-id');
  });

  it('falls back to ~/.nestor/machine-id when /etc/machine-id is absent', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      if (String(p) === '/etc/machine-id')
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      if (String(p) === nestorPath) return 'fallback-id';
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    expect(getMachineId()).toBe('fallback-id');
  });

  it('generates, persists (mode 0600), and returns a UUID when both files are absent', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const id = getMachineId();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(mkdirSpy).toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalledWith(nestorPath, id, { mode: 0o600 });
  });
});
