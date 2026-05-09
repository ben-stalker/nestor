# STORY-8.1: House schema (bin_schedules, subscriptions, home_maintenance, meter_readings, budgets)

**Epic:** EPIC-8: House Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** the House domain tables and repositories
**So that** all house features can persist

---

## Acceptance Criteria

- [ ] Migration creates `bin_schedules`, `subscriptions`, `home_maintenance`, `meter_readings`, `budget_categories`, `budget_expenses` per architecture data model
- [ ] Foreign keys with `ON DELETE CASCADE` where appropriate
- [ ] Indexes per architecture (`idx_meter_readings_date`, `idx_subscriptions_renewal`, etc.)
- [ ] Repositories `BinScheduleRepository`, `SubscriptionRepository`, `HomeMaintenanceRepository`, `MeterReadingRepository`, `BudgetRepository` extend `BaseRepository` with full CRUD
- [ ] Zod schemas for inputs
- [ ] Unit tests for all repos

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_house.sql`
- `server/src/repositories/BinScheduleRepository.ts`
- `server/src/repositories/SubscriptionRepository.ts`
- `server/src/repositories/HomeMaintenanceRepository.ts`
- `server/src/repositories/MeterReadingRepository.ts`
- `server/src/repositories/BudgetRepository.ts`
- `server/src/types/house.ts`
- `server/tests/repositories/house/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE bin_schedules (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  colour TEXT NOT NULL,
  icon TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  frequency_weeks INTEGER NOT NULL CHECK(frequency_weeks IN (1,2,4)),
  anchor_date INTEGER NOT NULL,
  bank_holiday_shift INTEGER NOT NULL DEFAULT 1,
  alert_evening_before INTEGER NOT NULL DEFAULT 1,
  alert_morning_of INTEGER NOT NULL DEFAULT 0,
  audio_chime INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  renewal_date INTEGER NOT NULL,
  trial_end_date INTEGER,
  cycle TEXT NOT NULL CHECK(cycle IN ('monthly','yearly','weekly','one_off')),
  active INTEGER NOT NULL DEFAULT 1
);
-- home_maintenance, meter_readings, budget_categories, budget_expenses similarly
CREATE INDEX idx_subscriptions_renewal ON subscriptions(renewal_date);
CREATE INDEX idx_meter_readings_date ON meter_readings(reading_date);
```
2. Each repository: `list`, `get`, `create`, `update`, `delete`. Where useful, `findUpcoming` (e.g. subscriptions renewing in N days).
3. Zod schemas mirror columns; amounts stored as minor units (pence/cents) — converted at API boundary.
4. Tests in-memory SQLite covering CRUD per repo.

### Key technical details

- Architecture data model owns full schema — author migrations from there.
- Money: store as integer minor units to avoid float drift (pennies, cents).
- Dates: epoch ms (consistent with calendar).
- Soft delete via `active=0` is preferred for subscriptions/bin_schedules (history preserved).

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-8.2 (bin calc), STORY-8.3 (bin UI), STORY-8.5 (subscriptions), STORY-8.6 (maintenance), STORY-8.7 (meter), STORY-8.8 (budget), STORY-8.10 (checklists)

---

## Test Checklist

- [ ] Unit: bin_schedules CRUD round-trip
- [ ] Unit: subscriptions findUpcoming respects window
- [ ] Unit: home_maintenance CRUD with linked contact
- [ ] Unit: meter_readings sorted by date
- [ ] Unit: budget_categories + expenses join
- [ ] Unit: cascade delete behaviour matches FK definitions

---

## Notes

- `checklists`/`checklist_items` are added in STORY-8.10 — kept separate to keep that story self-contained.
- `audio_chime` flag on bin_schedules feeds STORY-14.5.
