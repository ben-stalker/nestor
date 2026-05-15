import BaseRepository from './BaseRepository';
import type { HealthLog, HealthLogType } from '../types/family';

interface HealthLogRow {
  id: number;
  profile_id: number;
  log_type: string;
  data_json: string;
  logged_at: number;
}

function fromRow(row: HealthLogRow): HealthLog {
  return {
    ...row,
    log_type: row.log_type as HealthLogType,
    data_json: JSON.parse(row.data_json) as Record<string, unknown>,
  };
}

export default class HealthLogRepository extends BaseRepository {
  create(entry: Omit<HealthLog, 'id'>): HealthLog {
    const result = this.run(
      `INSERT INTO health_logs (profile_id, log_type, data_json, logged_at)
       VALUES (?, ?, ?, ?)`,
      [entry.profile_id, entry.log_type, JSON.stringify(entry.data_json), entry.logged_at],
    );
    return this.getById(result.lastInsertRowid as number)!;
  }

  getById(id: number): HealthLog | undefined {
    const row = this.queryOne<HealthLogRow>('SELECT * FROM health_logs WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  listForProfile(
    profileId: number,
    options: { logType?: HealthLogType; from?: number; to?: number; limit?: number } = {},
  ): HealthLog[] {
    const conditions: string[] = ['profile_id = ?'];
    const params: unknown[] = [profileId];

    if (options.logType) {
      conditions.push('log_type = ?');
      params.push(options.logType);
    }
    if (options.from !== undefined) {
      conditions.push('logged_at >= ?');
      params.push(options.from);
    }
    if (options.to !== undefined) {
      conditions.push('logged_at <= ?');
      params.push(options.to);
    }

    const limit = options.limit ?? 100;
    params.push(limit);

    const rows = this.all<HealthLogRow>(
      `SELECT * FROM health_logs WHERE ${conditions.join(' AND ')} ORDER BY logged_at DESC LIMIT ?`,
      params,
    );
    return rows.map(fromRow);
  }

  listInRange(profileId: number, from: number, to: number): HealthLog[] {
    return this.listForProfile(profileId, { from, to, limit: 1000 });
  }

  update(
    id: number,
    patch: { data_json?: Record<string, unknown>; logged_at?: number },
  ): HealthLog | undefined {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (patch.data_json !== undefined) {
      fields.push('data_json = ?');
      values.push(JSON.stringify(patch.data_json));
    }
    if (patch.logged_at !== undefined) {
      fields.push('logged_at = ?');
      values.push(patch.logged_at);
    }

    if (fields.length === 0) return this.getById(id);

    this.run(`UPDATE health_logs SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    return this.getById(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM health_logs WHERE id = ?', [id]);
  }
}
