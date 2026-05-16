import BaseRepository from './BaseRepository';
import type { Pet, PetInput } from '../types/pets';

interface PetRow {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  dob: string | null;
  colour: string | null;
  microchip: string | null;
  insurance_policy: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_address: string | null;
  feeding_notes: string | null;
  grooming_notes: string | null;
  photo_path: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
}

function fromRow(row: PetRow): Pet {
  return {
    ...row,
    species: row.species as Pet['species'],
    is_active: row.is_active === 1,
  };
}

export default class PetRepository extends BaseRepository {
  list(): Pet[] {
    const rows = this.all<PetRow>(
      'SELECT * FROM pets WHERE is_active = 1 ORDER BY name',
    );
    return rows.map(fromRow);
  }

  listAll(): Pet[] {
    const rows = this.all<PetRow>('SELECT * FROM pets ORDER BY name');
    return rows.map(fromRow);
  }

  get(id: number): Pet | undefined {
    const row = this.queryOne<PetRow>('SELECT * FROM pets WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: PetInput): Pet {
    const result = this.run(
      `INSERT INTO pets (name, species, breed, dob, colour, microchip, insurance_policy,
        vet_name, vet_phone, vet_address, feeding_notes, grooming_notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        input.name,
        input.species ?? 'dog',
        input.breed ?? null,
        input.dob ?? null,
        input.colour ?? null,
        input.microchip ?? null,
        input.insurance_policy ?? null,
        input.vet_name ?? null,
        input.vet_phone ?? null,
        input.vet_address ?? null,
        input.feeding_notes ?? null,
        input.grooming_notes ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, input: Partial<PetInput> & { photo_path?: string | null }): Pet {
    const fields = Object.keys(input) as (keyof typeof input)[];
    if (fields.length === 0) return this.get(id)!;
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = input[f];
      return v === undefined ? null : v;
    });
    this.run(
      `UPDATE pets SET ${setClauses}, updated_at = unixepoch() WHERE id = ?`,
      [...values, id],
    );
    return this.get(id)!;
  }

  delete(id: number): void {
    this.run('UPDATE pets SET is_active = 0, updated_at = unixepoch() WHERE id = ?', [id]);
  }
}
