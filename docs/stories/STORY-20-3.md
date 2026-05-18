# STORY-20.3: React Testing Library smoke tests on key components

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** developer
**I want** unit tests on critical components (DayCarousel, AlertsStrip, ProfileSwitcher)
**So that** regressions are caught early

---

## Acceptance Criteria

- [ ] At least 1 RTL test per epic's main page (Calendar, Food, Vehicles, Family, House, Finance, Pets, Board, Contacts, EV, Admin)
- [ ] `MockServiceWorker` (`msw`) mocks API for client tests
- [ ] All tests run via `npm test`

---

## Technical Implementation

### Files to create / modify

- `client/tests/mocks/server.ts` — msw setup
- `client/tests/mocks/handlers.ts` — handlers per module
- `client/tests/setup.ts` — start msw before tests
- `client/tests/{module}/*.test.tsx` — one per epic main page

### Implementation steps

1. Install msw: `npm i -D msw`.
2. Setup file:
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```
3. Handlers per module — return canned data:
```ts
http.get('/api/v1/profiles', () => HttpResponse.json([{ id: 1, name: 'Admin', type: 'admin', colour: '#000' }])),
http.get('/api/v1/calendar/events', () => HttpResponse.json([])),
// ...
```
4. One test per main page:
```ts
test('renders home page with greeting', async () => {
  render(<App />);
  expect(await screen.findByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
});
```
5. Wire all into `npm test`.

### Key technical details

- msw intercepts `fetch` so no real network calls in tests.
- One test per page is the minimum; more depth lands as the codebase matures.
- Tests ride on the JSDOM environment from STORY-20.1.

---

## Dependencies

- **Blocked by:** STORY-20.1
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: each main page renders without errors
- [ ] Unit: msw catches all fetches
- [ ] Manual: full client test suite < 30s

---

## Notes

- Component-level tests (each primitive) are valuable but Phase 2 — minimum viable smoke is one per page.
- msw also useful for Storybook scenarios.
