# STORY-7.1: Chores + completions + reward redemptions schema

**Epic:** EPIC-7: Family Module — Children & Health
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** developer
**I want** `chores`, `chore_completions`, `reward_redemptions`, and `health_logs` tables
**So that** family features can persist

---

## Acceptance Criteria

- [ ] Migrations create all four tables per architecture data model
- [ ] Index `idx_chore_completions_profile` on `chore_completions(profile_id, completed_at)`
- [ ] Repositories implemented:
  - `ChoreRepository` (CRUD, listForProfile)
  - `ChoreCompletionRepository` (push, listForProfile, todayCount)
  - `RewardRedemptionRepository` (push, balance, listForProfile)
  - `HealthLogRepository` (CRUD, listForProfile filterable by `log_type`)
- [ ] Unit tests

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_family.sql`
- `server/src/repositories/ChoreRepository.ts`
- `server/src/repositories/ChoreCompletionRepository.ts`
- `server/src/repositories/RewardRedemptionRepository.ts`
- `server/src/repositories/HealthLogRepository.ts`
- `server/src/types/family.ts`
- `server/tests/repositories/family/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE chores (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  assigned_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','one_off')),
  recurring_rule TEXT, -- optional RRULE for weekly with specific days
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE chore_completions (
  id INTEGER PRIMARY KEY,
  chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL
);
CREATE INDEX idx_chore_completions_profile ON chore_completions(profile_id, completed_at);
CREATE TABLE reward_redemptions (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  reward_label TEXT NOT NULL,
  redeemed_at INTEGER NOT NULL
);
CREATE TABLE health_logs (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK(log_type IN ('medicine','temperature','symptom','vaccination','growth','feed','nappy','sleep','mood','weight')),
  data_json TEXT NOT NULL,
  logged_at INTEGER NOT NULL
);
```
2. `RewardBalanceCalculation`:
```ts
balance(profileId: number) {
  const earned = db.prepare(`SELECT COALESCE(SUM(points_awarded),0) AS p FROM chore_completions WHERE profile_id = ?`).get(profileId).p;
  const spent = db.prepare(`SELECT COALESCE(SUM(points_spent),0) AS p FROM reward_redemptions WHERE profile_id = ?`).get(profileId).p;
  return earned - spent;
}
```
3. Tests including `todayCount(profileId)` honours timezone day boundaries.

### Key technical details

- Architecture data model.
- Health log `data_json` schema discriminates by `log_type` (validated at API boundary by Zod).
- Reward balance is computed not stored — keeps redemption integrity simple.
- Chore completions retained indefinitely (history matters for trends).

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-7.2 (chore endpoints), STORY-7.6 (health log API), STORY-8.9 (adult chores rota reuses)

---

## Test Checklist

- [ ] Unit: chore CRUD round-trip
- [ ] Unit: chore completion creates a row + index lookup fast
- [ ] Unit: reward balance = earned − spent
- [ ] Unit: health_logs CRUD with various log_types
- [ ] Unit: cascade delete profile → chore_completions/redemptions/health_logs gone

---

## Notes

- The `health_logs` table is shared by baby tracking, mood log, vaccination log — `log_type` discriminates.
- Chore frequency `recurring_rule` is optional advanced config; basic `daily`/`weekly` covers MVP.

---

## Progress

**Completed:** 2026-05-15

Implemented migration `010_family.sql` creating all four tables (`chores`, `chore_completions`, `reward_redemptions`, `health_logs`) with the specified indexes. Delivered `ChoreRepository`, `ChoreCompletionRepository`, `RewardRedemptionRepository`, and `HealthLogRepository` with full CRUD and computed reward balance. `FamilyRepositories.test.ts` covers 20 unit tests including cascade-delete and timezone-aware `todayCount`.
