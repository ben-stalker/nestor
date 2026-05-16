import BaseRepository from './BaseRepository';
import type { PetHealthLog, PetHealthLogInput, UpcomingCareItem } from '../types/pets';

interface PetHealthLogRow {
  id: number;
  pet_id: number;
  log_type: string;
  title: string;
  notes: string | null;
  log_date: string;
  next_due_date: string | null;
  reminder_days_before: number | null;
  weight_kg: number | null;
  document_path: string | null;
  document_name: string | null;
  linked_calendar_event_id: number | null;
  created_at: number;
  updated_at: number;
}

function fromRow(row: PetHealthLogRow): PetHealthLog {
  return {
    ...row,
    log_type: row.log_type as PetHealthLog['log_type'],
  };
}

interface UpcomingRow {
  log_id: number;
  pet_id: number;
  pet_name: string;
  log_type: string;
  title: string;
  next_due_date: string;
  reminder_days_before: number | null;
  days_until: number;
}

export default class PetHealthLogRepository extends BaseRepository {
  listForPet(petId: number): PetHealthLog[] {
    const rows = this.all<PetHealthLogRow>(
      'SELECT * FROM pet_health_logs WHERE pet_id = ? ORDER BY log_date DESC, created_at DESC',
      [petId],
    );
    return rows.map(fromRow);
  }

  get(id: number): PetHealthLog | undefined {
    const row = this.queryOne<PetHealthLogRow>('SELECT * FROM pet_health_logs WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(
    input: PetHealthLogInput & {
      pet_id: number;
      document_path?: string | null;
      document_name?: string | null;
      linked_calendar_event_id?: number | null;
    },
  ): PetHealthLog {
    const result = this.run(
      `INSERT INTO pet_health_logs
        (pet_id, log_type, title, notes, log_date, next_due_date, reminder_days_before,
         weight_kg, document_path, document_name, linked_calendar_event_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.pet_id,
        input.log_type,
        input.title,
        input.notes ?? null,
        input.log_date,
        input.next_due_date ?? null,
        input.reminder_days_before ?? 7,
        input.weight_kg ?? null,
        input.document_path ?? null,
        input.document_name ?? null,
        input.linked_calendar_event_id ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(
    id: number,
    input: Partial<PetHealthLogInput> & {
      document_path?: string | null;
      document_name?: string | null;
      linked_calendar_event_id?: number | null;
    },
  ): PetHealthLog {
    const allowedFields = [
      'log_type',
      'title',
      'notes',
      'log_date',
      'next_due_date',
      'reminder_days_before',
      'weight_kg',
      'document_path',
      'document_name',
      'linked_calendar_event_id',
    ] as const;

    const fields = (Object.keys(input) as (typeof allowedFields)[number][]).filter((f) =>
      (allowedFields as readonly string[]).includes(f),
    );

    if (fields.length === 0) return this.get(id)!;

    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = (input as Record<string, unknown>)[f];
      return v === undefined ? null : v;
    });

    this.run(`UPDATE pet_health_logs SET ${setClauses}, updated_at = unixepoch() WHERE id = ?`, [
      ...values,
      id,
    ]);
    return this.get(id)!;
  }

  delete(id: number): void {
    this.run('DELETE FROM pet_health_logs WHERE id = ?', [id]);
  }

  upcomingCare(daysAhead: number): UpcomingCareItem[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const rows = this.all<UpcomingRow>(
      `SELECT
        phl.id AS log_id,
        phl.pet_id,
        p.name AS pet_name,
        phl.log_type,
        phl.title,
        phl.next_due_date,
        phl.reminder_days_before,
        CAST(julianday(phl.next_due_date) - julianday('now') AS INTEGER) AS days_until
      FROM pet_health_logs phl
      JOIN pets p ON p.id = phl.pet_id
      WHERE phl.next_due_date IS NOT NULL
        AND phl.next_due_date >= ?
        AND phl.next_due_date <= ?
        AND p.is_active = 1
      ORDER BY phl.next_due_date ASC`,
      [todayStr, futureDateStr],
    );

    return rows.map((row) => ({
      log_id: row.log_id,
      pet_id: row.pet_id,
      pet_name: row.pet_name,
      log_type: row.log_type as UpcomingCareItem['log_type'],
      title: row.title,
      next_due_date: row.next_due_date,
      reminder_days_before: row.reminder_days_before,
      days_until: row.days_until,
    }));
  }
}
