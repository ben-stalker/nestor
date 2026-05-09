# STORY-19.3: Wizard step content — calendars (QR OAuth)

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** new user
**I want** to scan a QR code with my phone to connect Google Calendar
**So that** I don't have to type a long URL

---

## Acceptance Criteria

- [ ] QR rendered for OAuth device flow (uses STORY-4.5)
- [ ] Polling shows "waiting for confirmation" then "connected"
- [ ] Apple/Yahoo paths via standard form (STORY-4.6)
- [ ] Per-account: which profile owns which calendar (links via `profile_id`)
- [ ] Skip allowed; can be re-run from admin (STORY-17.4)
- [ ] Multiple accounts can be added before Next

---

## Technical Implementation

### Files to create / modify

- `client/src/wizard/steps/CalendarsStep.tsx`
- `client/src/wizard/GoogleQrPair.tsx`
- `client/src/wizard/ManualCalendarForm.tsx`
- `client/src/wizard/api.ts` — extend

### Implementation steps

1. `<CalendarsStep>`:
   - List of added accounts (delete to remove).
   - Buttons: "Add Google" / "Add Apple" / "Add Yahoo" / "Custom CalDAV".
2. `<GoogleQrPair>`:
   - Calls `POST /calendar/accounts/google/start`, displays QR (PNG data URL).
   - Polls `/poll/:deviceCode` every 5s; shows status text.
   - On success: closes, account appears in list with profile picker.
3. `<ManualCalendarForm>`:
   - Form: provider, display name, username, app password, optional URL.
   - "Test credentials" button before save.
4. Profile picker per account assigns which profile owns it.
5. Skip allowed but recommended; banner on dashboard if calendars missing.
6. Tests: QR shown; polling progresses; manual form submits.

### Key technical details

- Reuses STORY-4.5 device-flow endpoints.
- Profile picker writes `calendar_accounts.profile_id`.
- Polling timeout: 5 minutes; show "Try again" if expired.

---

## Dependencies

- **Blocked by:** STORY-19.1, STORY-4.5, STORY-4.6
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: Google flow shows QR
- [ ] RTL: polling state advances
- [ ] RTL: Apple form submits
- [ ] RTL: profile picker assigns owner
- [ ] RTL: skip works
- [ ] Manual: real Google account end-to-end (off-CI)

---

## Notes

- Custom CalDAV is plain URL + basic auth.
- QR contains the prefilled OAuth URL so phone goes straight to consent.
