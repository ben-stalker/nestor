import BaseRepository from './BaseRepository';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface Alert {
  id: number;
  type: string;
  severity: AlertSeverity;
  message: string;
  deep_link: string | null;
  profile_id: number | null;
  nav_mode_badge: string | null;
  dismissed: boolean;
  dismissed_at: number | null;
  read_at: number | null;
  created_at: number;
}

export interface BadgeCount {
  count: number;
  severity: AlertSeverity;
}

interface AlertRow {
  id: number;
  type: string;
  severity: string;
  message: string;
  deep_link: string | null;
  profile_id: number | null;
  nav_mode_badge: string | null;
  dismissed: number;
  dismissed_at: number | null;
  read_at: number | null;
  created_at: number;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { error: 3, warning: 2, info: 1 };

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

  markRead(navMode: string): void {
    this.run(
      'UPDATE alerts SET read_at = ? WHERE nav_mode_badge = ? AND dismissed = 0 AND read_at IS NULL',
      [Date.now(), navMode],
    );
  }

  badgeCounts(): Record<string, BadgeCount> {
    const rows = this.all<{ nav_mode_badge: string; count: number; severities: string }>(
      `SELECT nav_mode_badge,
              COUNT(*) as count,
              GROUP_CONCAT(severity) as severities
       FROM alerts
       WHERE dismissed = 0 AND read_at IS NULL AND nav_mode_badge IS NOT NULL
       GROUP BY nav_mode_badge`,
    );

    return rows.reduce<Record<string, BadgeCount>>((acc, row) => {
      const severityList = (row.severities ?? '').split(',');
      const topSeverity = severityList.reduce<AlertSeverity>((best, s) => {
        const rank = SEVERITY_RANK[s as AlertSeverity] ?? 0;
        return rank > SEVERITY_RANK[best] ? (s as AlertSeverity) : best;
      }, 'info');
      acc[row.nav_mode_badge] = { count: row.count, severity: topSeverity };
      return acc;
    }, {});
  }

  create(params: {
    type: string;
    severity?: AlertSeverity;
    message: string;
    deep_link?: string;
    profile_id?: number;
    nav_mode_badge?: string;
  }): Alert {
    const result = this.run(
      `INSERT INTO alerts (type, severity, message, deep_link, profile_id, nav_mode_badge, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        params.type,
        params.severity ?? 'info',
        params.message,
        params.deep_link ?? null,
        params.profile_id ?? null,
        params.nav_mode_badge ?? null,
        Date.now(),
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }
}

export default AlertRepository;
