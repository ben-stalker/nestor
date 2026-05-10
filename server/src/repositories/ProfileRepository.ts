import bcrypt from 'bcrypt';
import BaseRepository from './BaseRepository';
import {
  CreateProfileSchema,
  UpdateProfileSchema,
  type Profile,
  type CreateProfileInput,
  type UpdateProfileInput,
} from '../types/profile';
import type { Permissions } from '../types/permissions';
import LastAdminError from '../errors/profile';

export { LastAdminError };

interface ProfileRow {
  id: number;
  name: string;
  type: string;
  colour: string;
  pin_set: number;
  avatar_path: string | null;
  accessibility_json: string | null;
  permissions_json: string;
  text_size: string;
  simplified_nav: number;
  created_at: number;
}

interface PinRow {
  pin_hash: string | null;
}

interface CountRow {
  count: number;
}

interface TypeRow {
  type: string;
}

const PUBLIC_COLUMNS = `
  id, name, type, colour,
  CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as pin_set,
  avatar_path, accessibility_json,
  permissions_json, text_size, simplified_nav, created_at
`;

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Profile['type'],
    colour: row.colour,
    pinSet: row.pin_set === 1,
    avatar_path: row.avatar_path,
    accessibility_json: row.accessibility_json
      ? (JSON.parse(row.accessibility_json) as Record<string, unknown>)
      : null,
    permissions_json: JSON.parse(row.permissions_json) as Permissions,
    text_size: row.text_size as Profile['text_size'],
    simplified_nav: row.simplified_nav,
    created_at: row.created_at,
  };
}

class ProfileRepository extends BaseRepository {
  list(): Profile[] {
    const rows = this.all<ProfileRow>(`SELECT ${PUBLIC_COLUMNS} FROM profiles ORDER BY id`);
    return rows.map(toProfile);
  }

  get(id: number): Profile | undefined {
    const row = this.queryOne<ProfileRow>(`SELECT ${PUBLIC_COLUMNS} FROM profiles WHERE id = ?`, [
      id,
    ]);
    return row ? toProfile(row) : undefined;
  }

  create(input: CreateProfileInput): Profile {
    const data = CreateProfileSchema.parse(input);
    const pinHash = data.pin ? bcrypt.hashSync(data.pin, 10) : null;
    const now = Date.now();
    const permissionsStr = JSON.stringify(data.permissions_json ?? {});
    const accessibilityStr = data.accessibility_json
      ? JSON.stringify(data.accessibility_json)
      : null;

    const result = this.run(
      `INSERT INTO profiles
         (name, type, colour, pin_hash, avatar_path, accessibility_json,
          permissions_json, text_size, simplified_nav, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.type,
        data.colour,
        pinHash,
        data.avatar_path ?? null,
        accessibilityStr,
        permissionsStr,
        data.text_size,
        data.simplified_nav,
        now,
      ],
    );

    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: UpdateProfileInput): Profile {
    const data = UpdateProfileSchema.parse(patch);

    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Profile ${id} not found`);
    }

    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      sets.push('name = ?');
      params.push(data.name);
    }
    if (data.type !== undefined) {
      sets.push('type = ?');
      params.push(data.type);
    }
    if (data.colour !== undefined) {
      sets.push('colour = ?');
      params.push(data.colour);
    }
    if (data.pin !== undefined) {
      sets.push('pin_hash = ?');
      params.push(bcrypt.hashSync(data.pin, 10));
    }
    if ('avatar_path' in data && data.avatar_path !== undefined) {
      sets.push('avatar_path = ?');
      params.push(data.avatar_path);
    }
    if ('accessibility_json' in data && data.accessibility_json !== undefined) {
      sets.push('accessibility_json = ?');
      params.push(
        data.accessibility_json !== null ? JSON.stringify(data.accessibility_json) : null,
      );
    }
    if (data.permissions_json !== undefined) {
      sets.push('permissions_json = ?');
      params.push(JSON.stringify(data.permissions_json));
    }
    if (data.text_size !== undefined) {
      sets.push('text_size = ?');
      params.push(data.text_size);
    }
    if (data.simplified_nav !== undefined) {
      sets.push('simplified_nav = ?');
      params.push(data.simplified_nav);
    }

    if (sets.length > 0) {
      params.push(id);
      this.run(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return this.get(id)!;
  }

  delete(id: number): void {
    const target = this.queryOne<TypeRow>('SELECT type FROM profiles WHERE id = ?', [id]);
    if (!target) return;

    if (target.type === 'admin') {
      const row = this.queryOne<CountRow>(
        `SELECT COUNT(*) as count FROM profiles WHERE type = 'admin' AND id != ?`,
        [id],
      );
      if ((row?.count ?? 0) === 0) {
        throw new LastAdminError();
      }
    }

    this.run('DELETE FROM profiles WHERE id = ?', [id]);
  }

  listAdminPinHashes(): { id: number; pin_hash: string | null }[] {
    return this.all<{ id: number; pin_hash: string | null }>(
      `SELECT id, pin_hash FROM profiles WHERE type = 'admin'`,
    );
  }

  verifyPin(id: number, pin: string): boolean {
    const row = this.queryOne<PinRow>('SELECT pin_hash FROM profiles WHERE id = ?', [id]);
    if (!row || !row.pin_hash) return false;
    return bcrypt.compareSync(pin, row.pin_hash);
  }
}

export default ProfileRepository;
