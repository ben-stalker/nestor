# STORY-18.3: i18n lint rule (no hardcoded strings in JSX)

**Epic:** EPIC-18: Internationalisation & Accessibility
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a lint rule that fails when JSX contains literal strings
**So that** new features can't accidentally bypass i18n

---

## Acceptance Criteria

- [ ] `eslint-plugin-i18next` installed; `no-literal-string` rule enabled with reasonable allow-list
- [ ] CI fails on violations
- [ ] Documentation in `CONTRIBUTING.md`
- [ ] Allow-list includes: development URLs, debug labels, ARIA roles, test selectors, single-character punctuation

---

## Technical Implementation

### Files to create / modify

- `package.json` — add `eslint-plugin-i18next`
- `.eslintrc.json` — configure rule
- `CONTRIBUTING.md` — document
- `client/src/**/*.tsx` — fix existing violations

### Implementation steps

1. Install: `npm i -D eslint-plugin-i18next`.
2. ESLint config:
```json
{
  "plugins": ["i18next"],
  "rules": {
    "i18next/no-literal-string": ["error", {
      "markupOnly": true,
      "ignoreAttribute": ["data-testid","aria-label","placeholder"],
      "ignoreCallee": ["console.log","console.error","Error"],
      "ignoreProperty": ["className","style","src","href","key","id"],
      "ignore": ["—","·","|","/"]
    }]
  }
}
```
3. Run `eslint --fix client/src/` to find existing violations; replace with `t('key')`.
4. CI already runs eslint (STORY-1.2); will surface violations.
5. CONTRIBUTING.md section: "All user-visible strings must come from i18n via `useTranslation()`'s `t` or the `<Trans>` component."

### Key technical details

- Rule is intentionally strict; allow-list small.
- Punctuation and symbols allowed because they're locale-neutral.
- `aria-label` / `placeholder` allowed only if then translated separately via `t()`.

---

## Dependencies

- **Blocked by:** STORY-18.1
- **Blocks:** —

---

## Test Checklist

- [ ] CI: introducing a hardcoded string fails lint
- [ ] CI: test suite still passes after migration
- [ ] Manual: contributor docs explain the rule

---

## Notes

- The rule catches new violations going forward; existing violations need a one-off cleanup pass.
- A future `pseudo-locale` (e.g. `[Üñîçödé tëxt]`) helps catch missed strings visually.
