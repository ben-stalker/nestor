import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import { initCrypto } from '../../src/utils/crypto';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import BinScheduleRepository from '../../src/repositories/BinScheduleRepository';
import SubscriptionRepository from '../../src/repositories/SubscriptionRepository';
import HomeMaintenanceRepository from '../../src/repositories/HomeMaintenanceRepository';
import MeterReadingRepository from '../../src/repositories/MeterReadingRepository';
import BudgetRepository from '../../src/repositories/BudgetRepository';
import ChecklistRepository from '../../src/repositories/ChecklistRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

const ANCHOR = new Date('2025-01-06').getTime(); // known Monday

// ─── BinScheduleRepository ───────────────────────────────────────────────────

describe('BinScheduleRepository', () => {
  let db: Database.Database;
  let repo: BinScheduleRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new BinScheduleRepository(db);
  });

  afterEach(() => db.close());

  it('creates and retrieves a bin schedule', () => {
    const bin = repo.create({
      name: 'Recycling',
      colour: '#0000ff',
      icon: 'recycle',
      day_of_week: 1,
      frequency_weeks: 2,
      anchor_date: ANCHOR,
      bank_holiday_shift: true,
      reminder_evening_before: true,
      reminder_morning_of: false,
      audio_chime: false,
    });
    expect(bin.id).toBeGreaterThan(0);
    expect(bin.name).toBe('Recycling');
    expect(bin.frequency_weeks).toBe(2);
    expect(bin.bank_holiday_shift).toBe(true);
    expect(bin.active).toBe(true);
  });

  it('lists only active bins by default', () => {
    repo.create({
      name: 'General',
      colour: '#000',
      icon: 'trash',
      day_of_week: 0,
      frequency_weeks: 1,
      anchor_date: ANCHOR,
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: false,
      audio_chime: false,
    });
    const bin2 = repo.create({
      name: 'Garden',
      colour: '#0f0',
      icon: 'leaf',
      day_of_week: 2,
      frequency_weeks: 4,
      anchor_date: ANCHOR,
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: false,
      audio_chime: false,
    });
    repo.delete(bin2.id);
    const active = repo.list();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('General');
  });

  it('soft-deletes (sets active=false)', () => {
    const bin = repo.create({
      name: 'Food',
      colour: '#brown',
      icon: 'trash',
      day_of_week: 3,
      frequency_weeks: 1,
      anchor_date: ANCHOR,
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: false,
      audio_chime: false,
    });
    repo.delete(bin.id);
    const all = repo.list(false);
    const found = all.find((b) => b.id === bin.id);
    expect(found?.active).toBe(false);
  });

  it('updates a bin schedule', () => {
    const bin = repo.create({
      name: 'Old Name',
      colour: '#fff',
      icon: 'trash',
      day_of_week: 1,
      frequency_weeks: 1,
      anchor_date: ANCHOR,
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: false,
      audio_chime: false,
    });
    const updated = repo.update(bin.id, { name: 'New Name', frequency_weeks: 2 });
    expect(updated?.name).toBe('New Name');
    expect(updated?.frequency_weeks).toBe(2);
  });
});

// ─── SubscriptionRepository ───────────────────────────────────────────────────

describe('SubscriptionRepository', () => {
  let db: Database.Database;
  let repo: SubscriptionRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new SubscriptionRepository(db);
  });

  afterEach(() => db.close());

  const base = {
    name: 'Netflix',
    category: 'streaming' as const,
    monthly_cost: 1499,
    renewal_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
    alert_days_before: 7,
  };

  it('creates and retrieves a subscription', () => {
    const sub = repo.create(base);
    expect(sub.id).toBeGreaterThan(0);
    expect(sub.name).toBe('Netflix');
    expect(sub.monthly_cost).toBe(1499);
    expect(sub.active).toBe(true);
  });

  it('findRenewingWithin returns subscriptions due within N days', () => {
    repo.create({ ...base, renewal_date: Date.now() + 3 * 24 * 60 * 60 * 1000 });
    repo.create({ ...base, name: 'Disney+', renewal_date: Date.now() + 20 * 24 * 60 * 60 * 1000 });
    const soon = repo.findRenewingWithin(7);
    expect(soon).toHaveLength(1);
    expect(soon[0].name).toBe('Netflix');
  });

  it('findTrialEndingWithin returns trials ending within N days', () => {
    repo.create({
      ...base,
      name: 'Trial Sub',
      trial_end_date: Date.now() + 2 * 24 * 60 * 60 * 1000,
    });
    repo.create({
      ...base,
      name: 'Far Trial',
      trial_end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    const ending = repo.findTrialEndingWithin(5);
    expect(ending).toHaveLength(1);
    expect(ending[0].name).toBe('Trial Sub');
  });

  it('soft-deletes subscription', () => {
    const sub = repo.create(base);
    repo.delete(sub.id);
    expect(repo.list()).toHaveLength(0);
  });
});

// ─── HomeMaintenanceRepository ────────────────────────────────────────────────

describe('HomeMaintenanceRepository', () => {
  let db: Database.Database;
  let repo: HomeMaintenanceRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new HomeMaintenanceRepository(db);
  });

  afterEach(() => db.close());

  it('creates and retrieves a maintenance item', () => {
    const item = repo.create({
      title: 'Fix boiler',
      type: 'job',
      landlord_report: false,
      renter_mode: false,
    });
    expect(item.id).toBeGreaterThan(0);
    expect(item.title).toBe('Fix boiler');
    expect(item.type).toBe('job');
  });

  it('filters by type', () => {
    repo.create({ title: 'Boiler fix', type: 'job', landlord_report: false, renter_mode: false });
    repo.create({
      title: 'Boiler warranty',
      type: 'warranty',
      landlord_report: false,
      renter_mode: false,
    });
    const jobs = repo.list('job');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Boiler fix');
  });

  it('updates and deletes', () => {
    const item = repo.create({
      title: 'Old',
      type: 'reminder',
      landlord_report: false,
      renter_mode: false,
    });
    const updated = repo.update(item.id, { title: 'Updated', landlord_report: true });
    expect(updated?.title).toBe('Updated');
    expect(updated?.landlord_report).toBe(true);
    repo.delete(item.id);
    expect(repo.get(item.id)).toBeUndefined();
  });
});

// ─── MeterReadingRepository ───────────────────────────────────────────────────

describe('MeterReadingRepository', () => {
  let db: Database.Database;
  let repo: MeterReadingRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new MeterReadingRepository(db);
  });

  afterEach(() => db.close());

  it('creates and lists meter readings by fuel type', () => {
    repo.create({ fuel_type: 'electricity', reading_date: Date.now(), value: 1234.5, unit: 'kWh' });
    repo.create({ fuel_type: 'gas', reading_date: Date.now(), value: 567.0, unit: 'm3' });
    const elec = repo.listByFuelType('electricity');
    expect(elec).toHaveLength(1);
    expect(elec[0].value).toBe(1234.5);
  });

  it('deletes a reading', () => {
    const r = repo.create({ fuel_type: 'water', reading_date: Date.now(), value: 100, unit: 'm3' });
    repo.delete(r.id);
    expect(repo.get(r.id)).toBeUndefined();
  });
});

// ─── BudgetRepository ────────────────────────────────────────────────────────

describe('BudgetRepository', () => {
  let db: Database.Database;
  let repo: BudgetRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new BudgetRepository(db);
  });

  afterEach(() => db.close());

  it('creates and lists categories', () => {
    repo.createCategory({ name: 'Groceries', monthly_budget_minor: 30000 });
    repo.createCategory({ name: 'Utilities', monthly_budget_minor: 15000 });
    const cats = repo.listCategories();
    expect(cats).toHaveLength(2);
  });

  it('creates and lists expenses', () => {
    const cat = repo.createCategory({ name: 'Food', monthly_budget_minor: 20000 });
    repo.createExpense({ category_id: cat.id, amount_minor: 1500, spent_date: Date.now() });
    const expenses = repo.listExpenses(cat.id);
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount_minor).toBe(1500);
  });

  it('monthlySummary returns per-category totals', () => {
    const cat = repo.createCategory({ name: 'Shopping', monthly_budget_minor: 10000 });
    const may2026Start = new Date(2026, 4, 1).getTime();
    const may2026Mid = new Date(2026, 4, 15).getTime();
    repo.createExpense({ category_id: cat.id, amount_minor: 2500, spent_date: may2026Start });
    repo.createExpense({ category_id: cat.id, amount_minor: 1000, spent_date: may2026Mid });
    const summary = repo.monthlySummary(2026, 5);
    expect(summary).toHaveLength(1);
    expect(summary[0].spent_minor).toBe(3500);
    expect(summary[0].budget_minor).toBe(10000);
  });

  it('deletes category cascades to expenses', () => {
    const cat = repo.createCategory({ name: 'Temp', monthly_budget_minor: 0 });
    repo.createExpense({ category_id: cat.id, amount_minor: 500, spent_date: Date.now() });
    repo.deleteCategory(cat.id);
    expect(repo.listCategories()).toHaveLength(0);
    expect(repo.listExpenses(cat.id)).toHaveLength(0);
  });
});

// ─── ChecklistRepository ─────────────────────────────────────────────────────

describe('ChecklistRepository', () => {
  let db: Database.Database;
  let repo: ChecklistRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new ChecklistRepository(db);
  });

  afterEach(() => db.close());

  it('creates and retrieves a checklist with items', () => {
    const checklist = repo.create({ name: 'Morning', type: 'daily_reset' });
    repo.createItem(checklist.id, { text: 'Brush teeth', sort_order: 0 });
    repo.createItem(checklist.id, { text: 'Breakfast', sort_order: 1 });
    const full = repo.get(checklist.id);
    expect(full?.items).toHaveLength(2);
  });

  it('ticks and unticks an item', () => {
    const cl = repo.create({ name: 'Test', type: 'one_off' });
    const item = repo.createItem(cl.id, { text: 'Do thing', sort_order: 0 });
    const ticked = repo.tickItem(item.id, true);
    expect(ticked?.ticked).toBe(true);
    const unticked = repo.tickItem(item.id, false);
    expect(unticked?.ticked).toBe(false);
  });

  it('resetItems sets all ticked=false and updates last_reset_at', () => {
    const cl = repo.create({ name: 'Daily', type: 'daily_reset' });
    const item = repo.createItem(cl.id, { text: 'Task', sort_order: 0 });
    repo.tickItem(item.id, true);
    repo.resetItems(cl.id);
    const full = repo.get(cl.id);
    expect(full?.items[0].ticked).toBe(false);
    expect(full?.last_reset_at).toBeGreaterThan(0);
  });

  it('deletes a checklist and cascades to items', () => {
    const cl = repo.create({ name: 'Trip', type: 'trip' });
    repo.createItem(cl.id, { text: 'Pack bag', sort_order: 0 });
    repo.delete(cl.id);
    expect(repo.get(cl.id)).toBeUndefined();
  });

  it('updateItem updates text and section', () => {
    const cl = repo.create({ name: 'List', type: 'one_off' });
    const item = repo.createItem(cl.id, { text: 'Old text', sort_order: 0 });
    const updated = repo.updateItem(item.id, { text: 'New text', section: 'Morning' });
    expect(updated?.text).toBe('New text');
    expect(updated?.section).toBe('Morning');
  });

  it('seedTemplates seeds 7 templates when table is empty', () => {
    repo.seedTemplates();
    const lists = repo.list();
    expect(lists).toHaveLength(7);
  });

  it('seedTemplates does not seed if records already exist', () => {
    repo.create({ name: 'Existing', type: 'one_off' });
    repo.seedTemplates();
    const lists = repo.list();
    expect(lists).toHaveLength(1);
  });

  it('resetDailyChecklists resets daily_reset checklists not yet reset today', () => {
    const cl = repo.create({ name: 'Morning Routine', type: 'daily_reset' });
    const item = repo.createItem(cl.id, { text: 'Brush teeth', sort_order: 0 });
    repo.tickItem(item.id, true);
    repo.resetDailyChecklists();
    const full = repo.get(cl.id);
    expect(full?.items[0].ticked).toBe(false);
  });
});
