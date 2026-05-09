# STORY-18.1: i18next bootstrap (client + server) + locale settings

**Epic:** EPIC-18: Internationalisation & Accessibility
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** i18next initialised on both client and server with English base translation
**So that** every string can be externalised

---

## Acceptance Criteria

- [ ] `client/public/locales/en/translation.json` created with namespaces per module: `core`, `nav`, `home`, `calendar`, `food`, `vehicles`, `family`, `house`, `finance`, `pets`, `ev`, `board`, `contacts`, `admin`, `wizard`, `errors`
- [ ] `client/src/i18n.ts` bootstraps `i18next` + `react-i18next` with `i18next-http-backend` loading from `/locales/{{lng}}/translation.json`; default language read from `app_settings.language` (falls back to `en`)
- [ ] `server/src/i18n.ts` bootstraps `i18next` with `i18next-fs-backend`; used for alert messages and TTS strings; reads `app_settings.language`
- [ ] Server provides `t(key, opts?)` exported for use in services
- [ ] React components use `useTranslation(namespace?)` and `<Trans>` for HTML interpolation
- [ ] Language switching at runtime works without full reload — `i18n.changeLanguage(lng)` triggers re-render
- [ ] Server `GET /api/v1/locales/available` returns `Array<{ code: 'en', name: 'English' }>` for the admin language picker
- [ ] Tests verify load and key resolution

---

## Technical Implementation

### Files to create / modify

- `client/src/i18n.ts`
- `client/public/locales/en/translation.json` — initial keys for `core` (loading, save, cancel, delete, confirm), `nav` (one key per nav mode), `errors` (generic), and module placeholders
- `server/src/i18n.ts`
- `server/locales/en/translation.json` — server-side strings (alert messages, TTS phrases)
- `client/src/main.tsx` — import `'./i18n'` before `<RouterProvider>`
- `server/src/index.ts` — `await i18n.init()` before route registration
- `server/src/routes/locales.ts` — `GET /api/v1/locales/available`
- `client/tests/i18n.test.ts`

### Implementation steps

1. Install client deps: `i18next`, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`. Server deps: `i18next`, `i18next-fs-backend`.
2. Author `client/src/i18n.ts`:
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
i18n.use(HttpBackend).use(initReactI18next).init({
  fallbackLng: 'en', defaultNS: 'translation',
  ns: ['translation'], debug: import.meta.env.DEV,
  interpolation: { escapeValue: false },
  backend: { loadPath: '/locales/{{lng}}/translation.json' },
});
export default i18n;
```
3. Initial language: read `app_settings.language` from server before `i18n.init()` (preload via fetch and await), or call `i18n.changeLanguage` after settings load.
4. Author `client/public/locales/en/translation.json` with the namespace keys per AC. Use a flat key structure: `nav.home: "Home"`, `core.save: "Save"`, etc.
5. Server: `server/src/i18n.ts` uses `i18next-fs-backend` with `loadPath: path.join(__dirname, '../locales/{{lng}}/translation.json')`. Export `t = (key, opts) => i18n.t(key, opts)`.
6. `GET /api/v1/locales/available`: returns hard-coded list of supported languages (initially `[{ code: 'en', name: 'English' }]`). French is added in STORY-18.9.
7. Inject `<Trans>` and `useTranslation` usage in `<NavBar>` (STORY-2.7 already references `nav.home` keys — populate them here).

### Key technical details

- Architecture NFR-005: i18n on both client and server.
- `i18next-http-backend` lazy-loads JSON; works perfectly with Vite's `public/` directory.
- `i18next-browser-languagedetector` is optional — Nestor reads explicit setting from server, not browser language.
- Alert messages generated server-side (e.g. "MOT due in 3 days") use `t()` with template interpolation — they need to be in the household's chosen language.
- Tests: instantiate i18n with a mock backend providing a small JSON, assert `t('core.save')` returns "Save".

---

## Dependencies

- **Blocked by:** STORY-1.4, STORY-1.6
- **Blocks:** STORY-17.3 (locale admin), STORY-18.2 (formatters), STORY-18.3 (lint rule)

---

## Test Checklist

- [ ] Unit: `t('core.save')` returns "Save"
- [ ] Unit: missing key returns the key itself with debug warning
- [ ] Unit: `i18n.changeLanguage('fr')` causes subsequent `t()` calls to return French translations (when fr file exists; mock for this test)
- [ ] Integration: `GET /api/v1/locales/available` returns array with at least `{ code: 'en', name: 'English' }`
- [ ] Integration: server-side `alertMessage` example uses `t()` and returns localised string

---

## Notes

- The `<Trans>` component is preferred for any translation containing HTML markup or React components.
- The i18n lint rule (STORY-18.3) enforces no string literals in JSX once it lands.
- French translation contributions land in STORY-18.9.
