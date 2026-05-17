# STORY-12.3: Tap-to-dial via tel: + audio hardware check

**Epic:** EPIC-12: Contacts Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** S (0.5d)
**Priority:** P2
**Status:** complete

---

## User Story

**As a** household member
**I want** to tap a contact's phone number to call (if a phone is paired)
**So that** the device acts as a phone book

---

## Acceptance Criteria

- [x] Tap → triggers `tel:` link (OS handler / paired phone)
- [x] No actual telephony in MVP — relies on OS handler
- [x] Long-press (600ms) → copies number to clipboard
- [x] Tests

---

## Technical Implementation

- `tel:` anchor on phone in `ContactCard.tsx` (implemented as part of 12.2)
- `onPointerDown` 600ms timer → `navigator.clipboard.writeText(phone)`
- `onPointerUp/Leave` cancels timer

---

## Notes

- Tap-to-call relies entirely on the OS handler for `tel:` URIs.
- Long-press copy works on both touch and mouse devices via Pointer Events API.
