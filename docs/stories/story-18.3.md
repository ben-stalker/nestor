# STORY-18.3: i18n lint rule (no hardcoded strings in JSX)

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a developer, I want a lint rule that warns when JSX contains literal strings, so that new features can't accidentally bypass i18n.

## Acceptance Criteria
- [x] `eslint-plugin-i18next/no-literal-string` enabled with reasonable allow-list
- [x] Documentation in `CONTRIBUTING.md`
- [ ] CI fails on violations — rule is `warn` level (not `error`) because existing codebase has 1300+ hardcoded strings. Will be promoted to `error` in Epic 20 after full string migration.

## Implementation Notes
- Installed `eslint-plugin-i18next` as dev dependency
- Rule configured in `.eslintrc.cjs` under client source file override
- Mode: `jsx-only` (only JSX text nodes, not function arguments)
- Allow-list covers: className, aria-* attributes, data-* attributes, icon props, routing props, clsx/cn/console calls
- Currently generates 1327 warnings from pre-existing hardcoded strings — no new violations
- Per CONTRIBUTING.md: all NEW components must use `t()` from `useTranslation()`

## Files Changed
- `.eslintrc.cjs` (add i18next plugin + rule)
- `CONTRIBUTING.md` (i18n section)
