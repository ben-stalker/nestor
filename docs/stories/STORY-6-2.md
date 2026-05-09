# STORY-6.2: Vehicles CRUD UI

**Epic:** EPIC-6: Vehicles & Travel Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to add and edit vehicles of any type with their renewal dates
**So that** the app knows about every household vehicle

---

## Acceptance Criteria

- [ ] List page at `/vehicles` shows each vehicle's nickname, type, colour, registration, renewal countdown chips
- [ ] Add/edit form with type-specific fields:
  - cars/vans: MOT/tax/insurance/service dates + service due mileage
  - bicycles: hide MOT/tax/insurance
  - EVs: tax/insurance/service (no MOT in some regions)
- [ ] Photo upload (optional) using shared upload helper
- [ ] Delete confirmation modal
- [ ] Permission: admin only for create/update/delete; all profiles can read

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/vehicles.ts`
- `client/src/vehicles/VehicleList.tsx`
- `client/src/vehicles/VehicleForm.tsx`
- `client/src/vehicles/VehicleCard.tsx`
- `client/src/api/vehicles.ts`
- `client/src/shared/upload.ts` — generic photo upload helper (resize via sharp on server)
- `server/tests/routes/vehicles.test.ts`

### Implementation steps

1. Routes:
```ts
router.get('/', requireProfile, async (_req, res) => res.json(await vehicleRepo.list()));
router.post('/', requireAdmin, async (req, res) => { /* validate + create */ });
router.patch('/:id', requireAdmin, ...);
router.delete('/:id', requireAdmin, ...);
router.post('/:id/photo', requireAdmin, multerUpload.single('photo'), async (req, res) => {
  const path = await processAndStorePhoto(req.file, 'vehicles');
  await vehicleRepo.update(req.params.id, { photo_path: path });
  res.status(201).json({ path });
});
```
2. `VehicleList`: grid of `<VehicleCard>` with photo, nickname, registration, type icon, renewal countdown chips ("MOT 28d", "Tax 14d") with colour-tinted backgrounds based on urgency.
3. `<VehicleForm>` with `type` segmented control; conditional fields per type.
4. Renewal-date inputs with quick presets ("+1 year").
5. Photo input via `<input type="file" accept="image/*">`; preview before upload.
6. Tests: POST as admin creates; non-admin gets 403; type-specific fields validate.

### Key technical details

- PRD §12.
- Photo stored at `~/.nestor/uploads/vehicles/<uuid>.webp`, resized to 800px wide.
- Countdown chip colour: red <7d, amber <30d, blue otherwise.
- Form uses `react-hook-form` + Zod; type-specific schema variants via `discriminatedUnion`.

---

## Dependencies

- **Blocked by:** STORY-6.1
- **Blocks:** STORY-6.3 (bookings need a vehicle), STORY-6.4 (booking UI), STORY-6.6 (reminders)

---

## Test Checklist

- [ ] RTL: list renders empty state when no vehicles
- [ ] RTL: form shows MOT for car, hides MOT for bicycle
- [ ] RTL: photo upload preview displays
- [ ] RTL: countdown chip colour reflects urgency
- [ ] Unit: POST as admin → 201
- [ ] Unit: POST as child → 403

---

## Notes

- The countdown chips are also rendered on the home day cards (STORY-3.4) for vehicles with imminent renewals.
- Bicycles intentionally include `service_due` so the chore stays trackable.
