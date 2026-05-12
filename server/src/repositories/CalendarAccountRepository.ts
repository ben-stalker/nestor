import BaseRepository from './BaseRepository';
import { encrypt, decrypt } from '../utils/crypto';
import {
  AccountInputSchema,
  AccountUpdateSchema,
  type CalendarAccount,
  type AccountInput,
  type AccountUpdate,
} from '../types/calendar';

interface AccountRow {
  id: number;
  provider: string;
  display_name: string;
  caldav_url: string | null;
  credentials_encrypted: string;
  sync_interval_mins: number;
  last_sync_at: number | null;
  last_sync_error: string | null;
  profile_id: number | null;
  active: number;
}

function toAccount(row: AccountRow): CalendarAccount {
  return {
    id: row.id,
    provider: row.provider as CalendarAccount['provider'],
    display_name: row.display_name,
    caldav_url: row.caldav_url,
    sync_interval_mins: row.sync_interval_mins,
    last_sync_at: row.last_sync_at,
    last_sync_error: row.last_sync_error,
    profile_id: row.profile_id,
    active: row.active,
  };
}

export default class CalendarAccountRepository extends BaseRepository {
  list(): CalendarAccount[] {
    return this.all<AccountRow>('SELECT * FROM calendar_accounts ORDER BY id ASC').map(toAccount);
  }

  get(id: number): CalendarAccount | undefined {
    const row = this.queryOne<AccountRow>('SELECT * FROM calendar_accounts WHERE id = ?', [id]);
    return row ? toAccount(row) : undefined;
  }

  create(input: AccountInput): CalendarAccount {
    const parsed = AccountInputSchema.parse(input);
    const credentialsEncrypted = encrypt(JSON.stringify(parsed.credentials));
    const result = this.run(
      `INSERT INTO calendar_accounts
        (provider, display_name, caldav_url, credentials_encrypted, sync_interval_mins, profile_id, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        parsed.provider,
        parsed.display_name,
        parsed.caldav_url ?? null,
        credentialsEncrypted,
        parsed.sync_interval_mins,
        parsed.profile_id ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: AccountUpdate): CalendarAccount | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const parsed = AccountUpdateSchema.parse(patch);

    const sets: string[] = [];
    const params: unknown[] = [];

    if (parsed.display_name !== undefined) {
      sets.push('display_name = ?');
      params.push(parsed.display_name);
    }
    if (parsed.caldav_url !== undefined) {
      sets.push('caldav_url = ?');
      params.push(parsed.caldav_url);
    }
    if (parsed.credentials !== undefined) {
      sets.push('credentials_encrypted = ?');
      params.push(encrypt(JSON.stringify(parsed.credentials)));
    }
    if (parsed.sync_interval_mins !== undefined) {
      sets.push('sync_interval_mins = ?');
      params.push(parsed.sync_interval_mins);
    }
    if (parsed.profile_id !== undefined) {
      sets.push('profile_id = ?');
      params.push(parsed.profile_id);
    }
    if (parsed.active !== undefined) {
      sets.push('active = ?');
      params.push(parsed.active);
    }

    if (sets.length === 0) return existing;
    params.push(id);
    this.run(`UPDATE calendar_accounts SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.run('DELETE FROM calendar_accounts WHERE id = ?', [id]);
    return result.changes > 0;
  }

  markSynced(id: number, error?: string): void {
    this.run('UPDATE calendar_accounts SET last_sync_at = ?, last_sync_error = ? WHERE id = ?', [
      Date.now(),
      error ?? null,
      id,
    ]);
  }

  getCredentials(id: number): Record<string, unknown> {
    const row = this.queryOne<{ credentials_encrypted: string }>(
      'SELECT credentials_encrypted FROM calendar_accounts WHERE id = ?',
      [id],
    );
    if (!row) throw new Error(`CalendarAccount ${id} not found`);
    return JSON.parse(decrypt(row.credentials_encrypted)) as Record<string, unknown>;
  }

  listActive(): CalendarAccount[] {
    return this.all<AccountRow>(
      'SELECT * FROM calendar_accounts WHERE active = 1 ORDER BY id ASC',
    ).map(toAccount);
  }
}
