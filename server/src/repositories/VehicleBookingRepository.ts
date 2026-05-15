import BaseRepository from './BaseRepository';
import type { VehicleBooking, BookingInput, BookingUpdate } from '../types/vehicles';

interface BookingRow {
  id: number;
  vehicle_id: number;
  profile_id: number | null;
  start_datetime: number;
  end_datetime: number;
  business: number;
  miles: number | null;
  notes: string | null;
  created_at: number;
}

function fromRow(row: BookingRow): VehicleBooking {
  return { ...row, business: row.business === 1 };
}

export default class VehicleBookingRepository extends BaseRepository {
  listForVehicle(vehicleId: number, from?: number, to?: number): VehicleBooking[] {
    let sql = 'SELECT * FROM vehicle_bookings WHERE vehicle_id = ?';
    const params: unknown[] = [vehicleId];
    if (from !== undefined) {
      sql += ' AND end_datetime > ?';
      params.push(from);
    }
    if (to !== undefined) {
      sql += ' AND start_datetime < ?';
      params.push(to);
    }
    sql += ' ORDER BY start_datetime';
    return this.all<BookingRow>(sql, params).map(fromRow);
  }

  get(id: number): VehicleBooking | undefined {
    const row = this.queryOne<BookingRow>('SELECT * FROM vehicle_bookings WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  // Half-open interval [start, end) — touching boundary is NOT a conflict.
  findConflicts(
    vehicleId: number,
    start: number,
    end: number,
    excludeBookingId?: number,
  ): VehicleBooking[] {
    let sql =
      'SELECT * FROM vehicle_bookings WHERE vehicle_id = ? AND start_datetime < ? AND end_datetime > ?';
    const params: unknown[] = [vehicleId, end, start];
    if (excludeBookingId !== undefined) {
      sql += ' AND id != ?';
      params.push(excludeBookingId);
    }
    return this.all<BookingRow>(sql, params).map(fromRow);
  }

  create(vehicleId: number, input: BookingInput): VehicleBooking {
    const result = this.run(
      `INSERT INTO vehicle_bookings
         (vehicle_id, profile_id, start_datetime, end_datetime, business, miles, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicleId,
        input.profile_id ?? null,
        input.start_datetime,
        input.end_datetime,
        input.business ? 1 : 0,
        input.miles ?? null,
        input.notes ?? null,
        Date.now(),
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: BookingUpdate): VehicleBooking | undefined {
    const allowed: (keyof BookingUpdate)[] = [
      'profile_id',
      'start_datetime',
      'end_datetime',
      'business',
      'miles',
      'notes',
    ];
    const fields = allowed.filter((f) => f in patch);
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'business') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE vehicle_bookings SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM vehicle_bookings WHERE id = ?', [id]);
  }
}
