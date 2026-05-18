# STORY-18.1: i18next bootstrap (client + server) + locale settings

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a developer, I want i18next initialised on both client and server with English base translation, so that every string can be externalised.

## Acceptance Criteria
- [x] `client/public/locales/en/translation.json` populated with namespaces per module
- [x] `client/src/i18n.ts` bootstraps i18next + react-i18next, language from `app_settings.language`
- [x] `server/src/i18n.ts` bootstraps i18next-fs-backend; used for alert messages and TTS strings
- [x] Language switching at runtime works without reload
- [ ] `<Trans>` component preferred for HTML interpolation (convention documented, not enforced by code)

## Implementation Notes
- Installed: `i18next`, `react-i18next`, `i18next-http-backend` (client); `i18next`, `i18next-fs-backend` (server)
- Client wraps React tree in `<Suspense>` to handle async translation loading
- Server `i18n.ts` reads locales from `client/public/locales/` shared directory
- `AppShell` syncs `app_settings.language` → `setLanguage()` on change (no reload needed)
- `server/src/index.ts` syncs language via `settings:updated` event bus
- Translation namespaces: common, nav, home, calendar, food, family, admin, accessibility, locale, alerts, errors

## Files Changed
- `client/src/i18n.ts` (new)
- `client/public/locales/en/translation.json` (new)
- `client/src/main.tsx` (wrap with Suspense, import i18n)
- `server/src/i18n.ts` (new)
- `server/src/index.ts` (import i18n, sync language)
- `client/src/core/AppShell.tsx` (sync language/locale/currency on settings change)
