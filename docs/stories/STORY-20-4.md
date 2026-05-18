# STORY-20.4: Playwright E2E test suite

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut (continues into Sprint 10)
**Estimate:** XL (5d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** maintainer
**I want** the 10 critical user flows covered by Playwright
**So that** releases are safe

---

## Acceptance Criteria

- [ ] Playwright installed and configured (`playwright.config.ts`)
- [ ] Tests cover the 10 flows from architecture §"E2E flows":
  1. Setup wizard
  2. Profile switch with PIN
  3. Add event → carousel
  4. Recipe URL import → meal plan → shopping list
  5. Bin schedule → day cards
  6. Vehicle booking + conflict
  7. Chore complete → reward
  8. Plugin install (mock Tesla) → widget
  9. Dismiss alert → badge
  10. Voice command "Go to calendar" (mock STT)
- [ ] Runs in CI with Chromium headless
- [ ] Each test calls axe-core (per STORY-18.5)
- [ ] Test data isolated via in-memory SQLite per worker

---

## Technical Implementation

### Files to create / modify

- `playwright.config.ts`
- `e2e/*.spec.ts` (one per flow)
- `e2e/fixtures/server.ts` — boots a server instance per worker
- `e2e/fixtures/seed.ts` — seeds known state
- `.github/workflows/e2e.yml`
- `package.json` — `npm run e2e` script

### Implementation steps

1. Install Playwright: `npm i -D @playwright/test`.
2. Config:
```ts
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false, // shared dev server simplest
  reporter: [['html'], ['github']],
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev:e2e', port: 3000, reuseExistingServer: !process.env.CI },
});
```
3. `npm run dev:e2e`: runs server with `NESTOR_DB_PATH=/tmp/e2e.db`, seeds known state, then starts Vite.
4. Each spec covers the flow with reasonable selectors (`data-testid` for stability):
```ts
test('Profile switch with PIN', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('profile-avatar-1').click();
  await page.getByLabel('PIN').fill('1234');
  await page.getByRole('button', { name: 'Switch' }).click();
  await expect(page.getByText('Hello, Sarah')).toBeVisible();
});
```
5. Voice mock: hit `/internal/voice/command` with a fake transcript instead of real audio.
6. Plugin mock: copy `plugins/_test-tesla/` into plugins dir for that test.
7. axe-core integration:
```ts
import AxeBuilder from '@axe-core/playwright';
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
```
8. Run in CI on PR.

### Key technical details

- Risk R-04: CalDAV flow tests with mocked endpoints (use msw or local mock server).
- Each test has its own seeded DB so no cross-test pollution.
- Trace artefacts uploaded on failure for debugging.

---

## Dependencies

- **Blocked by:** STORY-20.2, all MVP stories
- **Blocks:** STORY-20.11 (release requires E2E green)

---

## Test Checklist

- [ ] CI: all 10 flows pass headless
- [ ] CI: axe-core finds zero critical violations
- [ ] Manual: trace artefacts on failure useful for debugging
- [ ] Manual: tests stable when re-run (no flakiness)

---

## Notes

- This is the longest single story in MVP — splitting into Sprints 9 and 10.
- A `--project=mobile` config lets us also test smaller viewports later.
