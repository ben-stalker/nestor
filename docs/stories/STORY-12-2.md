# STORY-12.2: Contacts list + categories UI

**Epic:** EPIC-12: Contacts Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a categorised contacts list (medical, school, pets, home services, emergency, family, tradespeople)
**So that** I can find any number quickly

---

## Acceptance Criteria

- [ ] Route `/contacts` mounted
- [ ] List grouped by category with collapsible sections
- [ ] Search by name/role across all categories
- [ ] Add/edit/delete (admin) — pencil/trash icons
- [ ] Each contact card: avatar (initials), name, role, phone (tap-to-call from STORY-12.3), email (mailto)
- [ ] Empty state per category

---

## Technical Implementation

### Files to create / modify

- `client/src/contacts/ContactsList.tsx`
- `client/src/contacts/ContactCard.tsx`
- `client/src/contacts/ContactForm.tsx`
- `client/src/api/contacts.ts`
- `client/tests/contacts/ContactsList.test.tsx`

### Implementation steps

1. `<ContactsList>`:
   - Search input at top (debounced).
   - Sections per category (admin sees all; child sees only emergency).
   - Section header with collapse toggle and count.
   - "Add contact" CTA (admin) opens `<ContactForm>`.
2. `<ContactCard>`: avatar circle with initials (colour-tinted by category), name, role, action buttons (call/email/edit).
3. `<ContactForm>`: standard fields + category select + linked pet/vehicle selects (the latter populated in STORY-12.4).
4. Search filters across name + role; preserves category grouping.
5. Tests: list renders, search filters, admin sees all categories, child sees emergency.

### Key technical details

- PRD §17.
- Avatar fallback: initials (e.g. "Dr. John Smith" → "JS").
- Tap-to-call uses `tel:` link in STORY-12.3 (placeholder button here; phone shown but not actionable yet).
- Categories fixed enum; admin can't add new categories in MVP.

---

## Dependencies

- **Blocked by:** STORY-12.1
- **Blocks:** STORY-12.3 (tap-to-dial), STORY-12.4 (cross-link)

---

## Test Checklist

- [ ] RTL: list renders sections per category
- [ ] RTL: search filters
- [ ] RTL: section collapse hides cards
- [ ] RTL: admin sees Add CTA; non-admin doesn't
- [ ] RTL: child profile sees only emergency section
- [ ] RTL: form submits → list refreshes

---

## Notes

- Phone numbers shown but not yet click-to-call (STORY-12.3 P2).
- A future vCard import is community plugin scope.
