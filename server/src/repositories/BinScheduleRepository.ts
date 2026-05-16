import BaseRepository from './BaseRepository';
import type { BinSchedule, BinScheduleInput, BinScheduleUpdate } from '../types/house';

interface BinScheduleRow {
  id: number;
  name: string;
  colour: string;
  icon: string;
  day_of_week: number;
  frequency_weeks: number;
  anchor_date: number;
  bank_holiday_shift: number;
  reminder_evening_before: number;
  reminder_morning_of: number;
  audio_chime: number;
  active: number;
}

function fromRow(row: BinScheduleRow): BinSchedule {
  return {
    ...row,
    frequency_weeks: row.frequency_weeks as 1 | 2 | 4,
    bank_holiday_shift: row.bank_holiday_shift === 1,
    reminder_evening_before: row.reminder_evening_before === 1,
    reminder_morning_of: row.reminder_morning_of === 1,
    audio_chime: row.audio_chime === 1,
    active: row.active === 1,
  };
}

export default class BinScheduleRepository extends BaseRepository {
  list(activeOnly = true): BinSchedule[] {
    const where = activeOnly ? 'WHERE active = 1' : '';
    const rows = this.all<BinScheduleRow>(`SELECT * FROM bin_schedules ${where} ORDER BY id`);
    return rows.map(fromRow);
  }

  get(id: number): BinSchedule | undefined {
    const row = this.queryOne<BinScheduleRow>('SELECT * FROM bin_schedules WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: BinScheduleInput): BinSchedule {
    const result = this.run(
      `INSERT INTO bin_schedules
         (name, colour, icon, day_of_week, frequency_weeks, anchor_date,
          bank_holiday_shift, reminder_evening_before, reminder_morning_of, audio_chime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.colour,
        input.icon,
        input.day_of_week,
        input.frequency_weeks,
        input.anchor_date,
        input.bank_holiday_shift ? 1 : 0,
        input.reminder_evening_before ? 1 : 0,
        input.reminder_morning_of ? 1 : 0,
        input.audio_chime ? 1 : 0,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: BinScheduleUpdate): BinSchedule | undefined {
    const boolFields = new Set([
      'bank_holiday_shift',
      'reminder_evening_before',
      'reminder_morning_of',
      'audio_chime',
    ]);
    const fields = Object.keys(patch) as (keyof BinScheduleUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (boolFields.has(f)) return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE bin_schedules SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('UPDATE bin_schedules SET active = 0 WHERE id = ?', [id]);
  }
}
