import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import PetRepository from '../../src/repositories/PetRepository';
import PetHealthLogRepository from '../../src/repositories/PetHealthLogRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import evaluatePetAlerts from '../../src/services/petAlertService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

describe('petAlertService', () => {
  let db: Database.Database;
  let petRepo: PetRepository;
  let petHealthRepo: PetHealthLogRepository;
  let alertRepo: AlertRepository;

  beforeEach(() => {
    db = makeDb();
    petRepo = new PetRepository(db);
    petHealthRepo = new PetHealthLogRepository(db);
    alertRepo = new AlertRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates alert for item due within threshold', () => {
    const pet = petRepo.create({ name: 'Buddy', species: 'dog' });
    const today = new Date().toISOString().split('T')[0];
    petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'flea_treatment',
      title: 'Flea treatment',
      log_date: '2024-01-01',
      next_due_date: today,
      reminder_days_before: 7,
    });

    evaluatePetAlerts(petRepo, petHealthRepo, alertRepo);
    const alerts = alertRepo.listActive();
    expect(alerts.some((a) => a.type === 'pet_care' && a.message.includes('Buddy'))).toBe(true);
  });

  it('does not duplicate existing alert', () => {
    const pet = petRepo.create({ name: 'Buddy', species: 'dog' });
    const today = new Date().toISOString().split('T')[0];
    petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'flea_treatment',
      title: 'Flea treatment',
      log_date: '2024-01-01',
      next_due_date: today,
      reminder_days_before: 7,
    });

    evaluatePetAlerts(petRepo, petHealthRepo, alertRepo);
    evaluatePetAlerts(petRepo, petHealthRepo, alertRepo);
    const petAlerts = alertRepo.listActive().filter((a) => a.type === 'pet_care');
    expect(petAlerts).toHaveLength(1);
  });

  it('skips items with no next_due_date', () => {
    const pet = petRepo.create({ name: 'Buddy', species: 'dog' });
    petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'vaccination',
      title: 'Rabies',
      log_date: '2024-01-01',
    });

    evaluatePetAlerts(petRepo, petHealthRepo, alertRepo);
    const petAlerts = alertRepo.listActive().filter((a) => a.type === 'pet_care');
    expect(petAlerts).toHaveLength(0);
  });

  it('skips items due far in the future', () => {
    const pet = petRepo.create({ name: 'Buddy', species: 'dog' });
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 60);
    const farFutureStr = farFuture.toISOString().split('T')[0];
    petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'vaccination',
      title: 'Annual',
      log_date: '2024-01-01',
      next_due_date: farFutureStr,
      reminder_days_before: 7,
    });

    evaluatePetAlerts(petRepo, petHealthRepo, alertRepo);
    const petAlerts = alertRepo.listActive().filter((a) => a.type === 'pet_care');
    expect(petAlerts).toHaveLength(0);
  });

  it('skips inactive pets', () => {
    const pet = petRepo.create({ name: 'Old Dog', species: 'dog' });
    petRepo.delete(pet.id);
    const today = new Date().toISOString().split('T')[0];
    petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'flea_treatment',
      title: 'Flea treatment',
      log_date: '2024-01-01',
      next_due_date: today,
    });

    evaluatePetAlerts(petRepo, petHealthRepo, alertRepo);
    const petAlerts = alertRepo.listActive().filter((a) => a.type === 'pet_care');
    expect(petAlerts).toHaveLength(0);
  });
});
