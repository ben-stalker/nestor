# STORY-1.7: TanStack Query + Zustand setup

**Status:** in_progress
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

- [ ] Install @tanstack/react-query, @tanstack/react-query-devtools, zustand
- [ ] Create `client/src/store/appStore.ts` (Zustand slice)
- [ ] Create `client/src/api/client.ts` (fetch wrapper)
- [ ] Create `client/src/components/ErrorBoundary.tsx`
- [ ] Update `client/src/main.tsx` — add QueryClientProvider + ErrorBoundary
- [ ] Add `server/src/routes/clientErrors.ts` — POST /api/v1/client-errors
- [ ] Register client errors route in `server/src/app.ts`
- [ ] Write tests (ErrorBoundary, appStore, apiClient)
- [ ] Run full test suite; all passing
- [ ] QA pass

## Progress Log

- 2026-05-09: Story started
