# STORY-10.2: Pets CRUD UI

**Epic:** EPIC-10: Pets Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** pet owner
**I want** to add pets with photo, microchip, vet contact, feeding/grooming notes
**So that** the household has the pet's details handy

---

## Acceptance Criteria

- [ ] Route `/pets` lists pets with photo, name, species, age, vet renewal countdown
- [ ] Add/edit form per PRD §16: name, species, breed, DOB, weight, microchip, insurance, vet (ContactPicker placeholder until STORY-12.4), feeding notes, grooming notes
- [ ] Photo upload via shared upload helper (STORY-5.2 generic)
- [ ] Vet contact picker uses `<ContactPicker category="pets">` (STORY-12.4)
- [ ] Permission: admin write; all read

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/pets.ts`
- `client/src/pets/PetList.tsx`
- `client/src/pets/PetForm.tsx`
- `client/src/pets/PetCard.tsx`
- `client/src/api/pets.ts`
- `server/tests/routes/pets.test.ts`

### Implementation steps

1. Routes: standard CRUD + photo upload `POST /api/v1/pets/:id/photo` (reuses `processAndStorePhoto` from STORY-5.2 with `dir='pets'`).
2. `<PetList>` grid of `<PetCard>`s.
3. `<PetForm>`:
   - Standard fields.
   - Species select with custom option.
   - DOB date picker → age computed in display.
   - Insurance fields.
   - Vet picker stub (until STORY-12.4): a Select that lists contacts where `category='pets'`.
   - Feeding & grooming notes (textarea).
   - Photo upload.
4. Tests: CRUD permission gating, photo upload success/failure.

### Key technical details

- PRD §16.
- Age display: years + months for puppies/kittens; just years otherwise.
- Photo path served from `/uploads/pets/<uuid>.webp`.
- ContactPicker is the standard pattern; until STORY-12.4 lands, the Select is a thin substitute.

---

## Dependencies

- **Blocked by:** STORY-10.1, STORY-12.1
- **Blocks:** STORY-10.3 (health log per pet), STORY-10.4 (vet appointments)

---

## Test Checklist

- [ ] Unit: CRUD round-trip
- [ ] Unit: photo upload
- [ ] Unit: child profile read → 200; write → 403
- [ ] RTL: form submits, list updates
- [ ] RTL: vet picker lists pets-category contacts
- [ ] RTL: insurance renewal countdown chip

---

## Notes

- A future "memorial mode" honours `active=0` pets in a separate section.
- Multiple pets per household — no max enforced.
