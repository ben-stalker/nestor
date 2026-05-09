# STORY-1.7: TanStack Query + Zustand setup

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** TanStack Query and Zustand wired into the React shell with a global error boundary
**So that** every module has a consistent data-fetching and client-state foundation

---

## Acceptance Criteria

- [ ] `<QueryClientProvider>` mounted at the app root with defaults: `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`, `refetchOnReconnect: 'always'`
- [ ] React Query Devtools visible only when `import.meta.env.DEV`
- [ ] `client/src/store/appStore.ts` exports a Zustand `useAppStore` with at minimum: `activeProfileId: string | null`, `adminPin: string | null` (transient, NOT persisted), `alertCount: number`, `voiceStatus: 'idle' | 'listening' | 'processing' | 'speaking'`, `setActiveProfileId(id)`, `setAdminPin(pin)`, `setAlertCount(n)`, `setVoiceStatus(s)`
- [ ] `activeProfileId` persisted to `localStorage` (Zustand `persist` middleware); `adminPin` is NEVER persisted
- [ ] `client/src/api/client.ts` exports `apiFetch<T>(path, init?)` — a thin `fetch` wrapper that prefixes `/api/v1`, sets `Content-Type: application/json` for JSON bodies, attaches `X-Profile-Id` and `X-Admin-Pin` headers from the store when present, parses JSON, and throws on non-2xx with `{ status, code, message, details }` Error subclass `ApiError`
- [ ] Global `<ErrorBoundary>` catches React render errors, displays a recovery card with a "Reload" button, and posts the error via `POST /api/v1/client-errors` with `{ message, stack, url, userAgent }`
- [ ] Server endpoint stub `POST /api/v1/client-errors` accepts the payload, logs it via pino at `warn`, returns 204
- [ ] Reduced-motion: error card respects `prefers-reduced-motion` (no animation on appear)

---

## Technical Implementation

### Files to create / modify

- `client/src/main.tsx` — wrap router in providers
- `client/src/store/appStore.ts`
- `client/src/api/client.ts` — `apiFetch`, `ApiError`
- `client/src/shared/ErrorBoundary.tsx`
- `client/src/queryClient.ts` — `QueryClient` configured with defaults
- `server/src/routes/clientErrors.ts` — receive endpoint
- `server/src/app.ts` — register the route
- `client/tests/store/appStore.test.ts`
- `client/tests/api/client.test.ts`

### Implementation steps

1. Install `@tanstack/react-query`, `@tanstack/react-query-devtools`, `zustand` in the client workspace.
2. `client/src/queryClient.ts`: `export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });`.
3. `client/src/store/appStore.ts`: `create<AppState>()(persist((set) => ({ activeProfileId: null, adminPin: null, alertCount: 0, voiceStatus: 'idle', setActiveProfileId: (id) => set({ activeProfileId: id }), … }), { name: 'nestor-app', partialize: (s) => ({ activeProfileId: s.activeProfileId }) }))`.
4. `client/src/api/client.ts`: define `class ApiError extends Error` with `status`, `code`, `details`. Implement `apiFetch<T>(path, init = {})` reading `useAppStore.getState()` for headers, `await fetch('/api/v1' + path, …)`, throw `ApiError` on non-2xx parsing the standard `{ error, code, details }` body.
5. `client/src/shared/ErrorBoundary.tsx`: class component implementing `getDerivedStateFromError`/`componentDidCatch`. In `componentDidCatch`, call `fetch('/api/v1/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, stack, url: location.href, userAgent: navigator.userAgent }) }).catch(() => {})` (errors here must not loop). Render a recovery `<Card>` with reload button (placeholder until STORY-2.5 lands `<Card>`).
6. `client/src/main.tsx`: nest providers `<QueryClientProvider client={queryClient}><ErrorBoundary><RouterProvider router={router} /></ErrorBoundary>{import.meta.env.DEV && <ReactQueryDevtools />}</QueryClientProvider>`.
7. `server/src/routes/clientErrors.ts`: `router.post('/client-errors', (req, res) => { req.log.warn({ clientError: req.body }, 'client error reported'); res.status(204).end(); })`. Validate body with Zod (`message: string, stack: string.optional(), url: string, userAgent: string`).
8. Mount the route in `server/src/app.ts`.
9. Author Jest/RTL tests: store updates, `apiFetch` happy path + error path (mock `fetch`), Error Boundary renders fallback on render error.

### Key technical details

- Architecture §Frontend "Key libraries": TanStack Query for server state, Zustand for client state.
- `X-Profile-Id` and `X-Admin-Pin` header convention is documented in Architecture §"Authentication & Authorization".
- Architecture §"Caching Strategy" → TanStack Query 30s stale; that's the source of the 30_000 default.
- Admin PIN must never be persisted (Architecture §Security): always entered fresh, held only in memory while in the admin route.
- Wrap `apiFetch` once — every domain hook (`useEvents`, `useRecipes`, etc.) builds on it.
- Reduced-motion: the error card should add `motion-reduce:transition-none` Tailwind utilities or check `window.matchMedia('(prefers-reduced-motion: reduce)')`.

---

## Dependencies

- **Blocked by:** STORY-1.6
- **Blocks:** STORY-1.10, STORY-2.7, STORY-2.8, every domain UI hook

---

## Test Checklist

- [ ] Unit: `useAppStore` set/get round-trips
- [ ] Unit: persist middleware writes only `activeProfileId` to `localStorage`, NOT `adminPin`
- [ ] Unit: `apiFetch` prefixes `/api/v1`, sets headers from store, parses JSON
- [ ] Unit: `apiFetch` throws `ApiError` on 400/401/500 with status, code, details
- [ ] Unit: `ErrorBoundary` renders fallback when a child throws and posts to `/api/v1/client-errors`
- [ ] Integration: `POST /api/v1/client-errors` returns 204 with valid body, 400 with invalid body
- [ ] Manual: throw an error in a component → recovery card appears with reload button

---

## Notes

- The store will gain more slices (filters, etc.) as modules land — keep this initial scaffold lean.
- React Query Devtools floats in dev mode only; never in production builds.
