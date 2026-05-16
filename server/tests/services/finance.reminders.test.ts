import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import FinanceRepository from '../../src/repositories/FinanceRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import evaluateFinanceReminders from '../../src/services/finance/reminders';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const START = new Date('2024-01-01').getTime();

describe('evaluateFinanceReminders — end_date alerts', () => {
  let db: Database.Database;
  let financeRepo: FinanceRepository;
  let alertRepo: AlertRepository;

  beforeEach(() => {
    db = makeDb();
    financeRepo = new FinanceRepository(db);
    alertRepo = new AlertRepository(db);
  });

  afterEach(() => db.close());

  it('pushes alert when agreement ends in exactly alert_months_before * 30 days', async () => {
    const alertMonths = 3;
    const daysAway = alertMonths * 30;
    const now = new Date('2025-01-01');
    const endDate = new Date(now.getTime() + daysAway * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Test Loan',
      type: 'loan',
      monthly_payment_minor: 10000,
      start_date: START,
      end_date: endDate,
      alert_months_before: alertMonths,
      currency: 'GBP',
    });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    const alerts = alertRepo.listActive();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe(`finance_end_1_${daysAway}d`);
    expect(alerts[0].message).toContain('Test Loan');
  });

  it('pushes alert at 7-day mark for agreements', async () => {
    const now = new Date('2025-01-01');
    const endDate = new Date(now.getTime() + 7 * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Short Loan',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      end_date: endDate,
      alert_months_before: 3,
      currency: 'GBP',
    });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    expect(alertRepo.listActive()[0].severity).toBe('warning');
  });

  it('does not push duplicate alerts', async () => {
    const now = new Date('2025-01-01');
    const endDate = new Date(now.getTime() + 7 * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Loan',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      end_date: endDate,
      alert_months_before: 3,
      currency: 'GBP',
    });

    await evaluateFinanceReminders(financeRepo, alertRepo, now);
    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
    expect(alertRepo.listActive()).toHaveLength(1);
  });

  it('does not push alert for inactive agreements', async () => {
    const now = new Date('2025-01-01');
    const endDate = new Date(now.getTime() + 7 * 86_400_000).getTime();

    const a = financeRepo.createAgreement({
      name: 'Inactive',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      end_date: endDate,
      alert_months_before: 3,
      currency: 'GBP',
    });
    financeRepo.updateAgreement(a.id, { active: false });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });

  it('does not push alert when end_date not in a trigger window', async () => {
    const now = new Date('2025-01-01');
    const endDate = new Date(now.getTime() + 45 * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Loan',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      end_date: endDate,
      alert_months_before: 3,
      currency: 'GBP',
    });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });
});

describe('evaluateFinanceReminders — fixed_rate_end_date alerts', () => {
  let db: Database.Database;
  let financeRepo: FinanceRepository;
  let alertRepo: AlertRepository;

  beforeEach(() => {
    db = makeDb();
    financeRepo = new FinanceRepository(db);
    alertRepo = new AlertRepository(db);
  });

  afterEach(() => db.close());

  it('pushes alert when fixed rate ends in 90 days', async () => {
    const now = new Date('2025-01-01');
    const fixedRateEnd = new Date(now.getTime() + 90 * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Fixed Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 120000,
      start_date: START,
      fixed_rate_end_date: fixedRateEnd,
      alert_months_before: 6,
      currency: 'GBP',
    });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    expect(alertRepo.listActive()[0].message).toContain('fixed rate');
  });

  it('pushes alert at 1 day mark with error severity', async () => {
    const now = new Date('2025-01-01');
    const fixedRateEnd = new Date(now.getTime() + 1 * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Expiring Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 100000,
      start_date: START,
      fixed_rate_end_date: fixedRateEnd,
      alert_months_before: 6,
      currency: 'GBP',
    });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    expect(alertRepo.listActive()[0].severity).toBe('error');
  });

  it('can push both end_date and fixed_rate alerts for same agreement', async () => {
    const now = new Date('2025-01-01');
    const endDate = new Date(now.getTime() + 7 * 86_400_000).getTime();
    const fixedRateEnd = new Date(now.getTime() + 30 * 86_400_000).getTime();

    financeRepo.createAgreement({
      name: 'Dual Alert Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 120000,
      start_date: START,
      end_date: endDate,
      fixed_rate_end_date: fixedRateEnd,
      alert_months_before: 3,
      currency: 'GBP',
    });

    const result = await evaluateFinanceReminders(financeRepo, alertRepo, now);
    expect(result.pushed).toBe(2);
  });
});
