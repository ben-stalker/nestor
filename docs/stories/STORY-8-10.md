# STORY-8.10: Checklists system foundation

**Epic:** EPIC-8: House Module
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** the unified `checklists` and `checklist_items` tables and a generic checklist UI
**So that** routines, packing lists, guest checklists all share the same engine

---

## Acceptance Criteria

- [ ] Schema per data model with `auto_reset_cron` column for periodic resets
- [ ] Templates bundled: nursery bag, morning routine, bedtime routine, packing, day trip, guest arrival, guest departure
- [ ] Reset job runs nightly + on-demand
- [ ] CRUD endpoints `/api/v1/checklists` and `/api/v1/checklists/:id/items`
- [ ] Generic `<Checklist>` component used across modules

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_checklists.sql`
- `server/src/repositories/ChecklistRepository.ts`
- `server/src/repositories/ChecklistItemRepository.ts`
- `server/src/services/ChecklistService.ts`
- `server/src/scheduler/jobs/checklistReset.ts`
- `server/src/data/checklist-templates.ts`
- `server/src/routes/checklists.ts`
- `client/src/shared/Checklist.tsx`
- `server/tests/services/ChecklistService.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE checklists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('one_off','recurring','routine','packing','guest','custom')),
  owner_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  auto_reset_cron TEXT,
  template_id TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE checklist_items (
  id INTEGER PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0,
  ticked INTEGER NOT NULL DEFAULT 0, ticked_at INTEGER, ticked_by_profile_id INTEGER
);
```
2. Templates:
```ts
export const CHECKLIST_TEMPLATES = {
  morning_routine: { name: 'Morning routine', type: 'routine', auto_reset_cron: '0 4 * * *', items: ['Brush teeth','Get dressed','Have breakfast','Pack school bag'] },
  bedtime_routine: { /* ... */ },
  nursery_bag: { /* ... */ },
  packing: { /* ... */ },
  day_trip: { /* ... */ },
  guest_arrival: { /* ... */ },
  guest_departure: { /* ... */ },
};
```
3. `ChecklistService.createFromTemplate(templateId, overrides)`.
4. Reset job (cron `0 4 * * *`): for each checklist with `auto_reset_cron`, evaluate cron against now using `node-cron` matcher; if it should reset, set all items `ticked=0`.
5. Routes: standard CRUD.
6. `<Checklist>` generic component:
```tsx
function Checklist({ checklistId }) {
  const { data } = useChecklist(checklistId);
  return data.items.map(item => <ChecklistItem key={item.id} item={item} onToggle={...}/>);
}
```
7. Tests: template instantiation; reset job sets items unticked; persistence.

### Key technical details

- PRD §19.
- Reset cron matches nightly at 04:00 by default; per-checklist override via `auto_reset_cron`.
- Used by morning/bedtime routines (STORY-7.10), packing lists (STORY-11.5), guest checklists (STORY-11.6).
- Templates bundled in code; user can edit cloned instances.

---

## Dependencies

- **Blocked by:** STORY-8.1
- **Blocks:** STORY-7.10 (children's routines), STORY-11.5 (general lists), STORY-11.6 (guest checklist)

---

## Test Checklist

- [ ] Unit: createFromTemplate clones template
- [ ] Unit: reset job unticks items
- [ ] Unit: per-checklist cron honoured
- [ ] Unit: CRUD round-trip
- [ ] Unit: item ordering by sort
- [ ] RTL: generic Checklist component ticks items

---

## Notes

- Templates are upgradable — adding items to a template doesn't auto-add to existing instances (intentional).
- A future "share template" community feature is Phase 2.
