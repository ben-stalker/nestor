import BaseRepository from './BaseRepository';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface Alert {
  id: number;
  type: string;
  severity: AlertSeverity;
  message: string;
  deep_link: string | null;
  profile_id: number | null;
  dismissed: boolean;
  dismissed_at: number | null;
  created_at: number;
}

interface AlertRow {
  id: number;
  type: string;
  severity: string;
  message: string;
  deep_link: string | null;
  profile_id: number | null;
  dismissed: number;
  dismissed_at: number | null;
  created_at: number;
}

function rowToAlert(row: AlertRow): Alert {
  return {
    ...row,
    severity: row.severity as AlertSeverity,
    dismissed: row.dismissed === 1,
  };
}

class AlertRepository extends BaseRepository {
  listActive(): Alert[] {
    const rows = this.all<AlertRow>(
      'SELECT * FROM alerts WHERE dismissed = 0 ORDER BY created_at DESC',
    );
    return rows.map(rowToAlert);
  }

  get(id: number): Alert | undefined {
    const row = this.queryOne<AlertRow>('SELECT * FROM alerts WHERE id = ?', [id]);
    return row ? rowToAlert(row) : undefined;
  }

  dismiss(id: number): boolean {
    const result = this.run(
      'UPDATE alerts SET dismissed = 1, dismissed_at = ? WHERE id = ? AND dismissed = 0',
      [Date.now(), id],
    );
    return result.changes > 0;
  }

  create(params: {
    type: string;
    severity?: AlertSeverity;
    message: string;
    deep_link?: string;
    profile_id?: number;
  }): Alert {
    const result = this.run(
      `INSERT INTO alerts (type, severity, message, deep_link, profile_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.type,
        params.severity ?? 'info',
        params.message,
        params.deep_link ?? null,
        params.profile_id ?? null,
        Date.now(),
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }
}

export default AlertRepository;
