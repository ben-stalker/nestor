# STORY-1.7: TanStack Query + Zustand setup

**Status:** complete
**Epic:** EPIC-1 — Project Foundation & Dev Environment
**Estimate:** M (2 days)
**Priority:** P1
**Dependencies:** STORY-1.6

## Goal

Wire TanStack Query and Zustand into the React shell with a global error boundary so every module has a consistent data-fetching and client-state foundation.

## Acceptance Criteria

- [ ] `QueryClientProvider` at app root with sensible defaults (30s stale, retry 1, refetchOnWindowFocus=false)
- [ ] DevTools enabled in development only
- [ ] `useAppStore` Zustand slice scaffold (active profile, alert count, voice status placeholders)
- [ ] Global `<ErrorBoundary>` catches render errors, shows recovery card, logs to server via `POST /api/v1/client-errors`
- [ ] `client/src/api/client.ts` thin fetch wrapper that adds `X-Profile-Id` and `X-Admin-Pin` headers from store

## Tasks

- [x] Install @tanstack/react-query, @tanstack/react-query-devtools, zustand
- [x] Create `client/src/store/appStore.ts` (Zustand slice)
- [x] Create `client/src/api/client.ts` (fetch wrapper)
- [x] Create `client/src/components/ErrorBoundary.tsx`
- [x] Update `client/src/main.tsx` — add QueryClientProvider + ErrorBoundary
- [x] Add `server/src/routes/clientErrors.ts` — POST /api/v1/client-errors
- [x] Register client errors route in `server/src/app.ts`
- [x] Write tests (ErrorBoundary, appStore, apiClient)
- [x] Run full test suite; all passing (46 total: 31 server + 15 client)
- [x] QA pass

## Progress Log

- 2026-05-09: Story started
- 2026-05-09: Story complete. Merged to main, pushed. 46 tests passing.
