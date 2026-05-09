# STORY-18.6: RTL preparation (CSS logical properties everywhere)

**Epic:** EPIC-18: Internationalisation & Accessibility
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** future contributor
**I want** the codebase to use logical properties so RTL can be added later
**So that** Phase 2 RTL is feasible

---

## Acceptance Criteria

- [ ] No `margin-left`/`right`, `padding-left`/`right`, `text-align: left/right` in core code
- [ ] Tailwind `rtl:` variants enabled but unused for MVP
- [ ] Lint rule against physical CSS direction properties (in custom code; Tailwind's auto-handling exempt)
- [ ] Documentation in `docs/contributing.md` about the rule

---

## Technical Implementation

### Files to create / modify

- `.eslintrc.json` or stylelint config — add rule
- `client/tailwind.config.ts` — set `rtl: true` (or use plugin)
- `client/src/styles/*.css` — replace physical with logical
- `docs/contributing.md` — document

### Implementation steps

1. Replace physical CSS:
   - `margin-left/right` → `margin-inline-start/end`
   - `padding-left/right` → `padding-inline-start/end`
   - `text-align: left/right` → `text-align: start/end`
   - `left/right` positioning → `inset-inline-start/end`
2. Tailwind: use `ms-`/`me-` (margin start/end) instead of `ml-`/`mr-`. Apply `tailwindcss-logical` plugin if available, OR rely on Tailwind 3.3+ logical aliases.
3. Stylelint rule (in `.stylelintrc.json`):
```json
{ "rules": { "declaration-property-value-disallowed-list": { "/^margin-(left|right)$/": [".*"], "/^padding-(left|right)$/": [".*"], "text-align": ["/^(left|right)$/"] } } }
```
4. CI runs stylelint over `client/src/**/*.css`.
5. Verify no MVP UI regressions in LTR mode.
6. Document.

### Key technical details

- Architecture NFR-005 / PRD §26 RTL phase 2.
- Tailwind 3.3+ provides `me-*`/`ms-*` etc. natively.
- Lint rule allows escape-hatch via `/* stylelint-disable-next-line */` for one-off exceptions.

---

## Dependencies

- **Blocked by:** STORY-2.5
- **Blocks:** STORY-18.9 (French acceptance test as a gentle proof)

---

## Test Checklist

- [ ] Lint: physical property → fails
- [ ] Manual: LTR layout unchanged
- [ ] Manual: enabling `dir="rtl"` on `<html>` flips margins/padding correctly

---

## Notes

- RTL is officially Phase 2 (PRD §26); this story is preparation only — no Arabic/Hebrew translations shipped.
- A future `dir="auto"` toggle in admin enables RTL system-wide.
