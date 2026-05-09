import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getDb } from '../db/connection';
import AppSettingsRepository from '../repositories/AppSettingsRepository';

const MACHINE_ID_FALLBACK_PATH = path.join(os.homedir(), '.nestor', 'machine-id');
const HKDF_INFO = Buffer.from('nestor-credentials');
const VERSION = 'v1';

export function getMachineId(): string {
  try {
    return fs.readFileSync('/etc/machine-id', 'utf8').trim();
  } catch {
    try {
      return fs.readFileSync(MACHINE_ID_FALLBACK_PATH, 'utf8').trim();
    } catch {
      const id = randomUUID();
      fs.mkdirSync(path.dirname(MACHINE_ID_FALLBACK_PATH), { recursive: true });
      fs.writeFileSync(MACHINE_ID_FALLBACK_PATH, id, { mode: 0o600 });
      return id;
    }
  }
}

export class CryptoService {
  private cachedKey: Buffer | null = null;

  constructor(
    private readonly repo: AppSettingsRepository,
    private readonly machineIdFn: () => string = getMachineId,
  ) {}

  private deriveKey(): Buffer {
    if (this.cachedKey) return this.cachedKey;

    const machineId = this.machineIdFn();

    let salt = this.repo.get<string>('encryption_salt');
    if (!salt) {
      salt = randomBytes(32).toString('base64');
      this.repo.set('encryption_salt', salt);
    }

    const saltBytes = Buffer.from(salt, 'base64');
    this.cachedKey = Buffer.from(hkdfSync('sha256', machineId, saltBytes, HKDF_INFO, 32));
    return this.cachedKey;
  }

  encrypt(plaintext: string): string {
    const key = this.deriveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
  }

  decrypt(blob: string): string {
    const parts = blob.split(':');
    if (parts[0] !== VERSION) {
      throw new Error('Unsupported ciphertext version');
    }
    if (parts.length !== 4) {
      throw new Error('Malformed ciphertext');
    }
    const [, ivB64, tagB64, ctB64] = parts;
    const key = this.deriveKey();
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  }
}

// Module-level singleton for application use; initialise on first call
let defaultService: CryptoService | null = null;

export function initCrypto(repo: AppSettingsRepository): void {
  defaultService = new CryptoService(repo);
}

function getService(): CryptoService {
  if (!defaultService) {
    defaultService = new CryptoService(new AppSettingsRepository(getDb()));
  }
  return defaultService;
}

export function encrypt(plaintext: string): string {
  return getService().encrypt(plaintext);
}

export function decrypt(ciphertext: string): string {
  return getService().decrypt(ciphertext);
}
