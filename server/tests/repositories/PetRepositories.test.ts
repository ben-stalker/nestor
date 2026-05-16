import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import PetRepository from '../../src/repositories/PetRepository';
import PetHealthLogRepository from '../../src/repositories/PetHealthLogRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

// ─── PetRepository ────────────────────────────────────────────────────────────

describe('PetRepository', () => {
  let db: Database.Database;
  let repo: PetRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new PetRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves a pet', () => {
    const pet = repo.create({ name: 'Buddy', species: 'dog' });
    expect(pet.id).toBeGreaterThan(0);
    expect(pet.name).toBe('Buddy');
    expect(pet.species).toBe('dog');
    expect(pet.is_active).toBe(true);
  });

  it('list() returns only active pets', () => {
    repo.create({ name: 'Buddy', species: 'dog' });
    const inactive = repo.create({ name: 'Old Cat', species: 'cat' });
    repo.delete(inactive.id);
    const active = repo.list();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Buddy');
  });

  it('listAll() includes inactive pets', () => {
    repo.create({ name: 'Buddy', species: 'dog' });
    const inactive = repo.create({ name: 'Old Cat', species: 'cat' });
    repo.delete(inactive.id);
    expect(repo.listAll()).toHaveLength(2);
  });

  it('get() returns undefined for nonexistent id', () => {
    expect(repo.get(9999)).toBeUndefined();
  });

  it('update() changes fields', () => {
    const pet = repo.create({ name: 'Buddy', species: 'dog' });
    const updated = repo.update(pet.id, { name: 'Max', breed: 'Labrador' });
    expect(updated.name).toBe('Max');
    expect(updated.breed).toBe('Labrador');
  });

  it('delete() soft-deletes (is_active=false)', () => {
    const pet = repo.create({ name: 'Buddy', species: 'dog' });
    repo.delete(pet.id);
    const after = repo.get(pet.id);
    expect(after?.is_active).toBe(false);
    expect(repo.list()).toHaveLength(0);
  });

  it('stores all optional fields', () => {
    const pet = repo.create({
      name: 'Luna',
      species: 'cat',
      breed: 'Siamese',
      dob: '2020-01-15',
      colour: 'cream',
      microchip: '123456789',
      insurance_policy: 'INS-001',
      vet_name: 'Dr Smith',
      vet_phone: '01234 567890',
      vet_address: '1 Vet Street',
      feeding_notes: 'Twice daily',
      grooming_notes: 'Weekly brush',
    });
    expect(pet.breed).toBe('Siamese');
    expect(pet.dob).toBe('2020-01-15');
    expect(pet.vet_name).toBe('Dr Smith');
  });
});

// ─── PetHealthLogRepository ───────────────────────────────────────────────────

describe('PetHealthLogRepository', () => {
  let db: Database.Database;
  let petRepo: PetRepository;
  let repo: PetHealthLogRepository;
  let petId: number;

  beforeEach(() => {
    db = makeDb();
    petRepo = new PetRepository(db);
    repo = new PetHealthLogRepository(db);
    petId = petRepo.create({ name: 'Buddy', species: 'dog' }).id;
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves a health log entry', () => {
    const entry = repo.create({
      pet_id: petId,
      log_type: 'vaccination',
      title: 'Rabies vaccine',
      log_date: '2024-01-15',
    });
    expect(entry.id).toBeGreaterThan(0);
    expect(entry.pet_id).toBe(petId);
    expect(entry.log_type).toBe('vaccination');
    expect(entry.title).toBe('Rabies vaccine');
  });

  it('listForPet() returns entries newest first', () => {
    repo.create({ pet_id: petId, log_type: 'vaccination', title: 'First', log_date: '2024-01-01' });
    repo.create({
      pet_id: petId,
      log_type: 'flea_treatment',
      title: 'Second',
      log_date: '2024-06-01',
    });
    const logs = repo.listForPet(petId);
    expect(logs).toHaveLength(2);
    expect(logs[0].log_date).toBe('2024-06-01');
  });

  it('update() changes fields', () => {
    const entry = repo.create({
      pet_id: petId,
      log_type: 'weight',
      title: 'Weight check',
      log_date: '2024-01-15',
      weight_kg: 10.5,
    });
    const updated = repo.update(entry.id, { weight_kg: 11.0 });
    expect(updated.weight_kg).toBe(11.0);
  });

  it('delete() removes the entry', () => {
    const entry = repo.create({
      pet_id: petId,
      log_type: 'vaccination',
      title: 'Test',
      log_date: '2024-01-01',
    });
    repo.delete(entry.id);
    expect(repo.get(entry.id)).toBeUndefined();
  });

  it('cascade deletes logs when pet deleted', () => {
    const entry = repo.create({
      pet_id: petId,
      log_type: 'vaccination',
      title: 'Test',
      log_date: '2024-01-01',
    });
    db.prepare('DELETE FROM pets WHERE id = ?').run(petId);
    expect(repo.get(entry.id)).toBeUndefined();
  });

  it('upcomingCare() returns logs due within N days', () => {
    const today = new Date();
    const inFiveDays = new Date(today);
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    const inFiveDaysStr = inFiveDays.toISOString().split('T')[0];

    repo.create({
      pet_id: petId,
      log_type: 'flea_treatment',
      title: 'Flea prevention',
      log_date: '2024-01-01',
      next_due_date: inFiveDaysStr,
    });

    const items = repo.upcomingCare(30);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].title).toBe('Flea prevention');
    expect(items[0].pet_name).toBe('Buddy');
  });

  it('upcomingCare() excludes logs beyond the window', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 60);
    const farFutureStr = farFuture.toISOString().split('T')[0];

    repo.create({
      pet_id: petId,
      log_type: 'vaccination',
      title: 'Annual vaccine',
      log_date: '2024-01-01',
      next_due_date: farFutureStr,
    });

    const items = repo.upcomingCare(30);
    expect(items).toHaveLength(0);
  });

  it('stores linked_calendar_event_id', () => {
    const entry = repo.create({
      pet_id: petId,
      log_type: 'vet_visit',
      title: 'Annual check',
      log_date: '2024-01-15',
      linked_calendar_event_id: 42,
    });
    expect(entry.linked_calendar_event_id).toBe(42);
  });
});
