# STORY-12.1: Contacts schema + CRUD endpoints

**Epic:** EPIC-12: Contacts Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** S (1d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** the `contacts` table with category enum and link fields
**So that** other modules can reference contacts

---

## Acceptance Criteria

- [x] Migration creates `contacts(id, name, role, phone, email, address, category, notes, linked_pet_id, linked_vehicle_id, created_at)`
- [x] Category enum: `medical`, `school`, `pets`, `home_services`, `emergency`, `family`, `trade`, `other`
- [x] Repository with full CRUD + `list({ category })`, `findByCategory`
- [x] CRUD endpoints `/api/v1/contacts?category=`
- [x] Permissions:
  - child: only `category='emergency'`
  - teen: full
  - admin: full
- [x] Tests (21 server tests)

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_contacts.sql`
- `server/src/repositories/ContactRepository.ts`
- `server/src/routes/contacts.ts`
- `server/src/types/contacts.ts`
- `server/tests/routes/contacts.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT NOT NULL CHECK(category IN ('medical','school','pets','home_services','emergency','family','trade','other')),
  notes TEXT,
  linked_pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
  linked_vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_contacts_category ON contacts(category);
```
2. Routes:
```ts
router.get('/', requireProfile, async (req, res) => {
  const cat = req.query.category as string | undefined;
  if (req.profile.type === 'child' && cat !== 'emergency') return res.status(403).json({ error: 'forbidden' });
  const list = cat ? contactRepo.list({ category: cat }) : contactRepo.list();
  if (req.profile.type === 'child') res.json(list.filter(c => c.category === 'emergency'));
  else res.json(list);
});
router.post('/', requireAdmin, ...);
router.patch('/:id', requireAdmin, ...);
router.delete('/:id', requireAdmin, ...);
```
3. Tests: child reads emergency only; admin full CRUD; non-admin write 403.

### Key technical details

- Architecture data model.
- `linked_pet_id` and `linked_vehicle_id` are useful for vet/MoT shop relationships (filled in STORY-12.4).
- Phone/email free-form strings; no validation beyond reasonable max length.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-12.2 (UI), STORY-12.4 (cross-link), STORY-10.2 (pet vet picker), STORY-8.6 (maintenance trade picker)

---

## Test Checklist

- [ ] Unit: CRUD round-trip
- [ ] Unit: child reading category=family → 403
- [ ] Unit: child reading without filter → only emergency
- [ ] Unit: teen reading any category → 200
- [ ] Unit: admin write → 201
- [ ] Unit: cascade nullify when linked pet deleted

---

## Notes

- A future "vCard import" is community plugin scope.
- Categories chosen per PRD §17.
