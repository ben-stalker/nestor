# Stories 10.1–10.6: Pets Module

**Epic:** EPIC-10 — Pets Module
**Status:** COMPLETE
**Completed:** 2026-05-16

---

## Summary

Full end-to-end pets module implementing database schema, repositories, API routes, alert service, and React UI with all six stories delivered.

---

## Acceptance Criteria

### STORY-10.1: Pets schema + repositories
- [x] Migration `015_pets.sql` creates `pets` and `pet_health_logs` tables with all required columns
- [x] Partial index `idx_pet_health_next_due` on `next_due_date IS NOT NULL`
- [x] `PetRepository`: `list()`, `listAll()`, `get()`, `create()`, `update()`, `delete()` (soft)
- [x] `PetHealthLogRepository`: `listForPet()`, `get()`, `create()`, `update()`, `delete()`, `upcomingCare()`
- [x] Zod types in `server/src/types/pets.ts`

### STORY-10.2: Pets CRUD API + client module
- [x] All 11 endpoints implemented with correct auth
- [x] Photo upload (multer + sharp → 800px webp → `~/.nestor/uploads/pets/`)
- [x] Document upload (PDF/JPEG/PNG → `~/.nestor/uploads/pet-docs/`)
- [x] Router mounted in `app.ts`
- [x] Client module: `types.ts`, `api.ts`, hooks, all components
- [x] `<Placeholder name="Pets" />` replaced with `<PetsPage />` in router

### STORY-10.3: Pet health log + vaccination/flea/worming reminders
- [x] `petAlertService.ts` creates `pet_care` alerts for items due within threshold
- [x] Deduplication via alertKey in message
- [x] Wired into `reminder-eval` scheduler job
- [x] Skips inactive pets

### STORY-10.4: Vet appointments → calendar event
- [x] POST health-log accepts optional `vet_appointment_date`
- [x] Creates `calendar_events` row with type=`vet`, colour=`#f97316`
- [x] Stores `linked_calendar_event_id` in `pet_health_logs`
- [x] UI shows "Added to calendar" chip on vet_visit entries with linked event
- [x] Pets registered as filter plugin via `filtersStore.registerPlugin`

### STORY-10.5: Pet weight log + chart
- [x] Weight log_type handled by existing schema
- [x] `WeightChart.tsx` renders SVG polyline for multiple weight entries
- [x] Shows single stat for one entry
- [x] Returns null when no weight data
- [x] Displayed in PetDetail Overview tab

### STORY-10.6: Pet documents upload
- [x] `document_path` / `document_name` columns in schema
- [x] POST/GET document endpoints
- [x] `DocumentList.tsx` shows documents with download links and delete
- [x] Upload modal: file picker (PDF/JPEG/PNG ≤ 10MB), title, date

---

## Files Created / Modified

### Server — New files
- `server/migrations/015_pets.sql`
- `server/src/types/pets.ts`
- `server/src/repositories/PetRepository.ts`
- `server/src/repositories/PetHealthLogRepository.ts`
- `server/src/services/petAlertService.ts`
- `server/src/routes/pets.ts`
- `server/tests/repositories/PetRepositories.test.ts`
- `server/tests/services/petAlertService.test.ts`
- `server/tests/routes/pets.test.ts`

### Server — Modified files
- `server/src/app.ts` — added petRepo, petHealthRepo, createPetsRouter
- `server/src/scheduler/index.ts` — added evaluatePetAlerts to reminder-eval

### Client — New files
- `client/src/pets/types.ts`
- `client/src/pets/api.ts`
- `client/src/pets/hooks/usePets.ts`
- `client/src/pets/hooks/usePetHealthLogs.ts`
- `client/src/pets/hooks/useUpcomingCare.ts`
- `client/src/pets/PetsPage.tsx`
- `client/src/pets/PetList.tsx`
- `client/src/pets/PetCard.tsx`
- `client/src/pets/PetDetail.tsx`
- `client/src/pets/PetFormModal.tsx`
- `client/src/pets/DocumentList.tsx`
- `client/src/pets/health/HealthLogList.tsx`
- `client/src/pets/health/HealthLogEntry.tsx`
- `client/src/pets/health/HealthLogFormModal.tsx`
- `client/src/pets/health/WeightChart.tsx`
- `client/tests/pets/PetsPage.test.tsx`
- `client/tests/pets/PetCard.test.tsx`
- `client/tests/pets/PetDetail.test.tsx`
- `client/tests/pets/HealthLogEntry.test.tsx`
- `client/tests/pets/WeightChart.test.tsx`

### Client — Modified files
- `client/src/router.tsx` — replaced Placeholder with PetsPage

---

## Test Counts

**Server new tests:** 25
- `PetRepositories.test.ts`: 8 tests (CRUD, soft delete, upcoming care, cascade)
- `petAlertService.test.ts`: 5 tests (alert creation, deduplication, future items, inactive pets)
- `pets.test.ts` (routes): 12 tests (GET list, POST, PATCH, DELETE, health log CRUD, vet calendar event, upcoming-care)

**Client new tests:** 22
- `PetsPage.test.tsx`: 3 tests
- `PetCard.test.tsx`: 5 tests
- `PetDetail.test.tsx`: 3 tests
- `HealthLogEntry.test.tsx`: 6 tests
- `WeightChart.test.tsx`: 5 tests

**Total new tests: 47**

---

## QA Results

- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors
- `npm test (server)`: 898 tests passing
- `npm test (client)`: 476 tests passing
