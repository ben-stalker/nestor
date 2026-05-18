# STORY-19.1: Setup wizard React component (10-step shell)

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** new user
**I want** a guided 10-step wizard on first boot
**So that** I can set up Nestor without a manual

---

## Acceptance Criteria

- [ ] Full-screen `<SetupWizard>` rendered when `app_settings.setup_complete=false`
- [ ] Progress indicator (1/10)
- [ ] Steps: language → locale → profiles → calendars → display → orientation → voice → features → plugins → done
- [ ] Each step has Next / Skip; skipped steps marked (badge on wizard re-entry)
- [ ] Re-accessible from Settings → Setup & Help
- [ ] Sets `app_settings.setup_complete = true` only after explicit "Finish" on done step

---

## Technical Implementation

### Files to create / modify

- `client/src/wizard/SetupWizard.tsx`
- `client/src/wizard/WizardProgress.tsx`
- `client/src/wizard/StepShell.tsx`
- `client/src/wizard/steps/*.tsx` (placeholders for steps 1–10)
- `client/src/router.tsx` — gate routes on `setup_complete`
- `client/tests/wizard/SetupWizard.test.tsx`

### Implementation steps

1. Router-level gate:
```tsx
const { data: settings } = useAppSettings();
if (!settings?.setup_complete) return <SetupWizard />;
return <AppShell />;
```
2. `<SetupWizard>` holds step index + step state map; renders the appropriate step component inside `<StepShell>`.
3. `<StepShell>` provides Back / Skip / Next buttons; Skip records the step as skipped.
4. Step components wired in subsequent stories (19.2/19.3/19.4); for now, placeholder `<div>Step N</div>`.
5. Persist step state to server `app_settings.wizard_state` so refresh resumes.
6. Final step "Done" → PATCH `setup_complete=true`.
7. Re-entry from Settings: `/admin/setup` re-mounts the wizard regardless of `setup_complete` flag.
8. Tests: progress 1/10, Next advances, Skip flags step as skipped.

### Key technical details

- PRD §29 wizard.
- Steps register via a list so adding a step is a one-liner.
- Skipped steps surface a banner on re-entry encouraging completion.
- Wizard takes over the whole screen — no nav, no profile switcher.

---

## Dependencies

- **Blocked by:** STORY-2.6
- **Blocks:** STORY-19.2, STORY-19.3, STORY-19.4 (steps)

---

## Test Checklist

- [ ] RTL: wizard renders when setup_complete=false
- [ ] RTL: progress indicator shows 1/10
- [ ] RTL: Next advances to step 2
- [ ] RTL: Skip flags as skipped
- [ ] RTL: Done sets setup_complete=true
- [ ] RTL: re-entry from /admin/setup works post-completion

---

## Notes

- Each step component is a separate file under `wizard/steps/` so multiple stories can land in parallel.
- The wizard is also reachable post-setup for users who want to redo.
