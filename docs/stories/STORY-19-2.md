# STORY-19.2: Wizard step content — language, locale, profiles

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** new user
**I want** to set language, locale, and create my profiles in the first three steps
**So that** the rest of the wizard speaks my language

---

## Acceptance Criteria

- [ ] Step 1: language selector (auto-detected default)
- [ ] Step 2: timezone (auto-detected) + date format + currency + units + temperature
- [ ] Step 3: profile builder — add multiple, choose type, colour, avatar, PIN if required
- [ ] Each step persists to `app_settings` / `profiles` immediately on Next
- [ ] First admin profile automatically created if none exists
- [ ] At least one admin profile required to proceed past step 3

---

## Technical Implementation

### Files to create / modify

- `client/src/wizard/steps/LanguageStep.tsx`
- `client/src/wizard/steps/LocaleStep.tsx`
- `client/src/wizard/steps/ProfilesStep.tsx`
- `client/src/wizard/ProfileBuilder.tsx`
- `client/src/wizard/api.ts`

### Implementation steps

1. `<LanguageStep>`:
   - Lists languages from `client/public/locales/*` (fetch from server `/api/v1/i18n/languages`).
   - Auto-select user's browser locale.
   - On Next: PATCH `app_settings.language` and call `i18n.changeLanguage`.
2. `<LocaleStep>`:
   - Reuse `<LocalisationPanel>` (STORY-17.3) without nav.
   - Auto-detect timezone via Intl.
3. `<ProfilesStep>`:
   - Profile builder with rows of add/edit cards.
   - Each row: type select, name, colour, avatar upload, PIN (optional for adults, recommended for admins).
   - Validate ≥ 1 admin before allowing Next.
   - "Use defaults" prefill creates one admin + space for partner/children.
4. PATCH each profile through STORY-2.2 endpoints.
5. Tests: language switch live; profile builder requires admin.

### Key technical details

- Auto-detected language and timezone offered as defaults; user can override.
- Avatar upload reuses photo helper.
- Profile creation calls the same endpoints as Profiles admin panel (STORY-17.2).
- Wizard saves on Next so back-button is safe.

---

## Dependencies

- **Blocked by:** STORY-19.1, STORY-2.4, STORY-17.3
- **Blocks:** STORY-19.3 (calendars step needs profiles), STORY-19.4

---

## Test Checklist

- [ ] RTL: language list rendered
- [ ] RTL: changing language re-renders strings
- [ ] RTL: locale step persists
- [ ] RTL: profile step requires ≥ 1 admin
- [ ] RTL: avatar upload works
- [ ] RTL: PIN required for admin

---

## Notes

- Per-profile permission matrix is left at type defaults during wizard; user can refine in admin (STORY-17.2).
- Adding more profiles later is from `/admin/profiles`.
