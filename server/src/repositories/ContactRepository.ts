import BaseRepository from './BaseRepository';
import type { Contact, ContactInput } from '../types/contacts';

interface ContactRow {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string;
  notes: string | null;
  linked_pet_id: number | null;
  linked_vehicle_id: number | null;
  created_at: number;
}

function fromRow(row: ContactRow): Contact {
  return {
    ...row,
    category: row.category as Contact['category'],
  };
}

export default class ContactRepository extends BaseRepository {
  list(opts?: { category?: string }): Contact[] {
    if (opts?.category) {
      const rows = this.all<ContactRow>('SELECT * FROM contacts WHERE category = ? ORDER BY name', [
        opts.category,
      ]);
      return rows.map(fromRow);
    }
    const rows = this.all<ContactRow>('SELECT * FROM contacts ORDER BY name');
    return rows.map(fromRow);
  }

  get(id: number): Contact | undefined {
    const row = this.queryOne<ContactRow>('SELECT * FROM contacts WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: ContactInput): Contact {
    const result = this.run(
      `INSERT INTO contacts (name, role, phone, email, address, category, notes, linked_pet_id, linked_vehicle_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.role ?? null,
        input.phone ?? null,
        input.email ?? null,
        input.address ?? null,
        input.category,
        input.notes ?? null,
        input.linked_pet_id ?? null,
        input.linked_vehicle_id ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, input: Partial<ContactInput>): Contact {
    const fields = Object.keys(input) as (keyof typeof input)[];
    if (fields.length === 0) return this.get(id)!;
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = input[f];
      return v === undefined ? null : v;
    });
    this.run(`UPDATE contacts SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id)!;
  }

  delete(id: number): void {
    this.run('DELETE FROM contacts WHERE id = ?', [id]);
  }
}
