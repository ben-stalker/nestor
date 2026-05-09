# STORY-10.4: Vet appointments → calendar event with pet filter

**Epic:** EPIC-10: Pets Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** pet owner
**I want** vet appointments to show on the calendar with the pet's filter
**So that** I see them in context

---

## Acceptance Criteria

- [ ] Adding a vet appointment from pet detail creates a `calendar_events` row with `type='vet'` and links to pet via `linked_pet_id` (column added to events)
- [ ] Pet filter in sidebar (STORY-2.9) shows/hides vet events
- [ ] Post-visit notes field on the appointment (saved back to pet_health_logs `vet_visit` entry once date is past)
- [ ] Editing the calendar event also updates the pet_health_logs entry
- [ ] Permission: pet owner / admin can write

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_events_linked_pet.sql` — add `linked_pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL`
- `server/src/services/PetVetAppointmentService.ts`
- `client/src/pets/VetAppointmentForm.tsx`
- `client/src/calendar/EventModal.tsx` — render pet badge when `linked_pet_id` present
- `server/tests/services/PetVetAppointmentService.test.ts`

### Implementation steps

1. Migration adds nullable `linked_pet_id` to `calendar_events`.
2. Service:
```ts
async function createVetAppointment(petId, when, vetContactId, notes) {
  const event = await eventRepo.create({ title: i18n.t('vet.appointment',{petName:pet.name}), start_datetime: when, end_datetime: when + 60*60*1000, type: 'vet', linked_pet_id: petId, source: 'local', notes });
  const log = await petHealthRepo.create({ pet_id: petId, log_type: 'vet_visit', data_json: JSON.stringify({ event_id: event.id, vet_contact_id: vetContactId, notes }), logged_at: Date.now(), next_due_date: when, reminder_days_before: 1 });
  return { event, log };
}
```
3. Pet detail "Vet" tab: list of appointments + "Book" CTA opening `<VetAppointmentForm>`.
4. Calendar `<EventModal>`: when event has `linked_pet_id`, show pet badge + link to pet detail.
5. Sidebar pet filter (added in STORY-2.9 placeholder): toggling pets in `useFilters().pets` filters events by `linked_pet_id`.
6. Tests: creating creates both event + log; cascade nullify when pet deleted.

### Key technical details

- The pet filter uses `linked_pet_id` directly — no extra query.
- Post-visit notes editable from either pet detail or event modal; both write to the same log.
- Events with `type='vet'` get a distinct icon in views.
- Filter contract: `useFilters().pets` is `number[]` of pet IDs; calendar query passes them as a query param if/when the pet filter chips are populated.

---

## Dependencies

- **Blocked by:** STORY-10.2, STORY-4.10, STORY-2.9
- **Blocks:** STORY-3.4 (day card pet markers)

---

## Test Checklist

- [ ] Unit: creating vet appointment creates event + log
- [ ] Unit: cascade nullify on pet delete
- [ ] Unit: filter by pet returns only that pet's events
- [ ] RTL: pet detail shows upcoming vet appointments
- [ ] RTL: event modal shows pet badge

---

## Notes

- The `linked_pet_id` column is also useful for future "find all events for this pet" view.
- A future bidirectional sync with vet practice management software is plugin scope.
