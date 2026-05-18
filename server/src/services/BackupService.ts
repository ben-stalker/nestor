import type Database from 'better-sqlite3';
import logger from '../utils/logger';

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupPayload {
  schema_version: 1;
  exported_at: string;
  tables: Record<string, unknown[]>;
  photos: unknown[];
}

function getUserTables(db: Database.Database): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

export class BackupService {
  static exportAll(db: Database.Database): BackupPayload {
    const tableNames = getUserTables(db);
    const tables: Record<string, unknown[]> = Object.fromEntries(
      tableNames.map((name) => [name, db.prepare(`SELECT * FROM "${name}"`).all()]),
    );
    return {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      tables,
      photos: [],
    };
  }

  static importAll(db: Database.Database, payload: unknown): void {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      (payload as Record<string, unknown>).schema_version !== BACKUP_SCHEMA_VERSION
    ) {
      throw new Error('Invalid backup: schema_version must be 1');
    }

    const backup = payload as BackupPayload;
    const tableNames = getUserTables(db);

    db.transaction(() => {
      // Delete all existing rows (reverse order for FK safety)
      [...tableNames].reverse().forEach((name) => {
        db.prepare(`DELETE FROM "${name}"`).run();
      });

      // Re-insert from payload
      tableNames.forEach((name) => {
        const rows = backup.tables[name];
        if (!rows || rows.length === 0) return;

        const firstRow = rows[0] as Record<string, unknown>;
        const columns = Object.keys(firstRow);
        if (columns.length === 0) return;

        const placeholders = columns.map(() => '?').join(', ');
        const colList = columns.map((c) => `"${c}"`).join(', ');
        const stmt = db.prepare(`INSERT INTO "${name}" (${colList}) VALUES (${placeholders})`);

        rows.forEach((row) => {
          const r = row as Record<string, unknown>;
          stmt.run(columns.map((c) => r[c]));
        });
      });

      logger.info({ tables: Object.keys(backup.tables) }, 'Backup import complete');
    })();
  }
}
