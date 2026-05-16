import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import FinanceRepository from '../../src/repositories/FinanceRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const START = new Date('2024-01-01').getTime();
const END = new Date('2029-01-01').getTime();

// ─── FinanceRepository — Agreements ──────────────────────────────────────────

describe('FinanceRepository — agreements', () => {
  let db: Database.Database;
  let repo: FinanceRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new FinanceRepository(db);
  });

  afterEach(() => db.close());

  it('lists empty agreements', () => {
    expect(repo.listAgreements()).toEqual([]);
  });

  it('creates and retrieves an agreement', () => {
    const created = repo.createAgreement({
      name: 'Home Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 120000,
      start_date: START,
      end_date: END,
      alert_months_before: 6,
      currency: 'GBP',
    });
    expect(created.name).toBe('Home Mortgage');
    expect(created.type).toBe('mortgage');
    expect(created.monthly_payment_minor).toBe(120000);
    expect(created.active).toBe(true);
    expect(repo.getAgreement(created.id)).toMatchObject({ name: 'Home Mortgage' });
  });

  it('creates mortgage with fixed_rate_end_date', () => {
    const fixed = new Date('2026-01-01').getTime();
    const created = repo.createAgreement({
      name: 'Fixed Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 90000,
      start_date: START,
      fixed_rate_end_date: fixed,
      alert_months_before: 6,
      currency: 'GBP',
    });
    expect(created.fixed_rate_end_date).toBe(fixed);
  });

  it('creates PCP with balloon_payment_minor', () => {
    const created = repo.createAgreement({
      name: 'Car PCP',
      type: 'pcp',
      monthly_payment_minor: 30000,
      start_date: START,
      balloon_payment_minor: 800000,
      alert_months_before: 3,
      currency: 'GBP',
    });
    expect(created.balloon_payment_minor).toBe(800000);
  });

  it('updates an agreement', () => {
    const created = repo.createAgreement({
      name: 'Old Name',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    const updated = repo.updateAgreement(created.id, { name: 'New Name', active: false });
    expect(updated?.name).toBe('New Name');
    expect(updated?.active).toBe(false);
  });

  it('returns undefined for non-existent update', () => {
    expect(repo.updateAgreement(9999, { name: 'X' })).toBeUndefined();
  });

  it('deletes an agreement', () => {
    const created = repo.createAgreement({
      name: 'To Delete',
      type: 'bnpl',
      monthly_payment_minor: 1000,
      start_date: START,
      alert_months_before: 1,
      currency: 'GBP',
    });
    repo.deleteAgreement(created.id);
    expect(repo.getAgreement(created.id)).toBeUndefined();
  });

  it('filters active only', () => {
    repo.createAgreement({
      name: 'Active',
      type: 'loan',
      monthly_payment_minor: 1000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    const inactive = repo.createAgreement({
      name: 'Inactive',
      type: 'loan',
      monthly_payment_minor: 2000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    repo.updateAgreement(inactive.id, { active: false });
    expect(repo.listAgreements(true)).toHaveLength(1);
    expect(repo.listAgreements(false)).toHaveLength(2);
  });

  it('returns monthlyByType summary', () => {
    repo.createAgreement({
      name: 'Mortgage 1',
      type: 'mortgage',
      monthly_payment_minor: 100000,
      start_date: START,
      alert_months_before: 6,
      currency: 'GBP',
    });
    repo.createAgreement({
      name: 'Loan 1',
      type: 'loan',
      monthly_payment_minor: 20000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    const summary = repo.monthlyByType();
    const mortgageRow = summary.find((r) => r.type === 'mortgage');
    expect(mortgageRow?.total).toBe(100000);
  });
});

// ─── FinanceRepository — Savings Goals ───────────────────────────────────────

describe('FinanceRepository — savings goals', () => {
  let db: Database.Database;
  let repo: FinanceRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new FinanceRepository(db);
  });

  afterEach(() => db.close());

  it('lists empty goals', () => {
    expect(repo.listSavingsGoals()).toEqual([]);
  });

  it('creates and retrieves a goal', () => {
    const goal = repo.createSavingsGoal({
      name: 'Holiday Fund',
      target_amount_minor: 300000,
      current_amount_minor: 50000,
      currency: 'GBP',
    });
    expect(goal.name).toBe('Holiday Fund');
    expect(goal.target_amount_minor).toBe(300000);
    expect(goal.current_amount_minor).toBe(50000);
    expect(repo.getSavingsGoal(goal.id)).toMatchObject({ name: 'Holiday Fund' });
  });

  it('updates a goal', () => {
    const goal = repo.createSavingsGoal({
      name: 'Car Fund',
      target_amount_minor: 500000,
      current_amount_minor: 0,
      currency: 'GBP',
    });
    const updated = repo.updateSavingsGoal(goal.id, { current_amount_minor: 100000 });
    expect(updated?.current_amount_minor).toBe(100000);
  });

  it('deletes a goal', () => {
    const goal = repo.createSavingsGoal({
      name: 'Delete Me',
      target_amount_minor: 10000,
      current_amount_minor: 0,
      currency: 'GBP',
    });
    repo.deleteSavingsGoal(goal.id);
    expect(repo.getSavingsGoal(goal.id)).toBeUndefined();
  });

  it('no-op update returns current state', () => {
    const goal = repo.createSavingsGoal({
      name: 'Static',
      target_amount_minor: 10000,
      current_amount_minor: 0,
      currency: 'GBP',
    });
    const same = repo.updateSavingsGoal(goal.id, {});
    expect(same?.name).toBe('Static');
  });
});
