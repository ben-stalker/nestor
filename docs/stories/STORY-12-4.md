# STORY-12.4: Cross-linking from pets / maintenance

**Epic:** EPIC-12: Contacts Module
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** Contact picker components used from Pets (vet) and Maintenance (tradesperson)
**So that** there is one source of truth for contacts

---

## Acceptance Criteria

- [x] `<ContactPicker category="">` component reusable across modules
- [x] Pet vet field uses `category='pets'` (vet_contact_id via migration 018)
- [x] Maintenance tradesperson uses `category='trade'` (contact_id already in migration 011)
- [x] Linked contacts appear in `linked_pet_id` / `linked_vehicle_id` columns where relevant
- [x] Picker also offers "Add new contact" inline
- [x] 5 ContactPicker tests

---

## Technical Implementation

### Files to create / modify

- `client/src/contacts/ContactPicker.tsx`
- `client/src/pets/PetForm.tsx` — replace stub with `<ContactPicker category="pets">`
- `client/src/house/MaintenanceForm.tsx` — replace stub with `<ContactPicker category="trade">`
- `client/tests/contacts/ContactPicker.test.tsx`

### Implementation steps

1. `<ContactPicker>`:
```tsx
function ContactPicker({ category, value, onChange }) {
  const { data: contacts = [] } = useContacts({ category });
  return <>
    <select value={value ?? ''} onChange={e => onChange(Number(e.target.value) || null)}>
      <option value="">— None —</option>
      {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.role ? ` (${c.role})` : ''}</option>)}
    </select>
    <button onClick={openAddNew}>+ Add new</button>
  </>;
}
```
2. "Add new" opens an inline modal with the contacts form (auto-sets category); on save, picker selects the newly created contact.
3. Replace stubs in PetForm and MaintenanceForm.
4. Reverse linkage: when picker value changes, parent module updates its row (`pets.vet_contact_id` or `home_maintenance.linked_contact_id`).
5. Tests: select existing; add new flow; clear sets null.

### Key technical details

- Single component eliminates drift between modules.
- `useContacts({ category })` is the canonical query.
- For vet linkage on pets, also update reverse `contacts.linked_pet_id` so `Contacts → Pet` link shows on contact card.

---

## Dependencies

- **Blocked by:** STORY-12.2, STORY-10.2, STORY-8.6
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: picker lists contacts in category
- [ ] RTL: select changes value
- [ ] RTL: add-new flow creates contact and selects it
- [ ] RTL: clear sets null
- [ ] Manual: pet form + maintenance form pick correctly

---

## Notes

- A future autocomplete (typeahead) is nice once contact lists grow large; for MVP a select is enough.
- Linked contacts appear in the contact card's "Linked to..." section.
