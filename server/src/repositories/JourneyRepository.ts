import BaseRepository from './BaseRepository';

export type TransportMode = 'transit' | 'drive' | 'walk' | 'cycle';

export interface Journey {
  id: number;
  profile_id: number;
  label: string;
  origin: string;
  destination: string;
  transport_mode: TransportMode;
  days_active: number;
  provider_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateJourneyParams {
  profile_id: number;
  label: string;
  origin: string;
  destination: string;
  transport_mode?: TransportMode;
  days_active?: number;
  provider_id?: string;
}

export interface UpdateJourneyParams {
  label?: string;
  origin?: string;
  destination?: string;
  transport_mode?: TransportMode;
  days_active?: number;
  provider_id?: string;
}

class JourneyRepository extends BaseRepository {
  listForProfile(profileId: number): Journey[] {
    return this.all<Journey>(
      'SELECT * FROM journeys WHERE profile_id = ? ORDER BY created_at ASC',
      [profileId],
    );
  }

  listActiveToday(profileId: number): Journey[] {
    const dayOfWeek = new Date().getDay();
    // eslint-disable-next-line no-bitwise
    const bit = 1 << dayOfWeek;
    return this.all<Journey>(
      'SELECT * FROM journeys WHERE profile_id = ? AND (days_active & ?) != 0 ORDER BY created_at ASC',
      [profileId, bit],
    );
  }

  get(id: number): Journey | undefined {
    return this.queryOne<Journey>('SELECT * FROM journeys WHERE id = ?', [id]);
  }

  create(params: CreateJourneyParams): Journey {
    const now = Date.now();
    const result = this.run(
      `INSERT INTO journeys (profile_id, label, origin, destination, transport_mode, days_active, provider_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.profile_id,
        params.label,
        params.origin,
        params.destination,
        params.transport_mode ?? 'transit',
        params.days_active ?? 127,
        params.provider_id ?? null,
        now,
        now,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, params: UpdateJourneyParams): Journey | undefined {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (params.label !== undefined) {
      fields.push('label = ?');
      values.push(params.label);
    }
    if (params.origin !== undefined) {
      fields.push('origin = ?');
      values.push(params.origin);
    }
    if (params.destination !== undefined) {
      fields.push('destination = ?');
      values.push(params.destination);
    }
    if (params.transport_mode !== undefined) {
      fields.push('transport_mode = ?');
      values.push(params.transport_mode);
    }
    if (params.days_active !== undefined) {
      fields.push('days_active = ?');
      values.push(params.days_active);
    }
    if (params.provider_id !== undefined) {
      fields.push('provider_id = ?');
      values.push(params.provider_id);
    }

    if (fields.length === 0) return this.get(id);

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    this.run(`UPDATE journeys SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.run('DELETE FROM journeys WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

export default JourneyRepository;
