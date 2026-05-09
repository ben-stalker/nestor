# STORY-10.1: Pets schema + repositories

**Epic:** EPIC-10: Pets Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** `pets` and `pet_health_logs` tables and repos
**So that** pet features can persist

---

## Acceptance Criteria

- [ ] Migrations create `pets` and `pet_health_logs` per architecture data model
- [ ] Index `idx_pet_health_next_due` partial on `next_due_date IS NOT NULL`
- [ ] Repositories with CRUD + `upcomingCare(daysAhead)` returning logs whose next_due_date is within window
- [ ] Tests

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_pets.sql`
- `server/src/repositories/PetRepository.ts`
- `server/src/repositories/PetHealthLogRepository.ts`
- `server/src/types/pets.ts`
- `server/tests/repositories/pets/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE pets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT, dob INTEGER, weight_kg REAL,
  microchip_number TEXT,
  insurance_provider TEXT, insurance_policy TEXT, insurance_renewal_date INTEGER,
  vet_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  feeding_notes TEXT, grooming_notes TEXT,
  photo_path TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE pet_health_logs (
  id INTEGER PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK(log_type IN ('vaccination','flea_worming','medication','vet_visit','weight','document','symptom')),
  data_json TEXT NOT NULL,
  logged_at INTEGER NOT NULL,
  next_due_date INTEGER,
  reminder_days_before INTEGER NOT NULL DEFAULT 7
);
CREATE INDEX idx_pet_health_next_due ON pet_health_logs(next_due_date) WHERE next_due_date IS NOT NULL;
```
2. `PetHealthLogRepository.upcomingCare(daysAhead)`:
```ts
upcomingCare(daysAhead: number) {
  const horizon = Date.now() + daysAhead * 86_400_000;
  return this.db.prepare(`SELECT * FROM pet_health_logs WHERE next_due_date IS NOT NULL AND next_due_date <= ? ORDER BY next_due_date ASC`).all(horizon);
}
```
3. Tests cover CRUD and partial-index query.

### Key technical details

- Architecture data model.
- `vet_contact_id` references contacts (STORY-12.1) — set null on contact delete.
- Partial index keeps queries fast for the common "what's due?" question without indexing inactive past entries.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-10.2 (CRUD UI), STORY-10.3 (health log + reminders), STORY-10.4 (vet appointments calendar)

---

## Test Checklist

- [ ] Unit: pet CRUD
- [ ] Unit: health log CRUD with each log_type
- [ ] Unit: upcomingCare(30) returns logs within window
- [ ] Unit: cascade delete pet → health logs gone
- [ ] Unit: vet contact delete → vet_contact_id set null

---

## Notes

- Active flag preserves history (memorial mode for deceased pets).
- Documents (vaccination certs, insurance) stored separately in STORY-10.6 P2.
