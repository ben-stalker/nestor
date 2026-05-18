# STORY-18.5: Axe-core integration in Playwright

**Status:** deferred — blocked on STORY-20.4 (Playwright E2E setup)

## User Story
As a developer, I want every E2E test to assert no critical accessibility violations, so that WCAG 2.1 AA targets are protected.

## Acceptance Criteria
- [ ] `@axe-core/playwright` integrated into Playwright config
- [ ] Each E2E test calls `expect(await axe()).toHaveNoCriticalViolations()`
- [ ] Documented violations exempt list (with rationale) in `docs/a11y-exemptions.md`

## Dependencies
- **STORY-20.4** — Playwright E2E infrastructure must be set up first

## Implementation Notes
This story is deferred until Epic 20 (Testing, Polish & Release) completes STORY-20.4,
which establishes the Playwright test harness. Once Playwright is operational:

1. Install: `npm install @axe-core/playwright --save-dev`
2. In the Playwright global setup / each test file, add:
   ```ts
   import AxeBuilder from '@axe-core/playwright';
   const results = await new AxeBuilder({ page }).analyze();
   expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
   ```
3. Document any known exceptions in `docs/a11y-exemptions.md` with rationale.

## Progress
- 2026-05-18: Story created, blocked on STORY-20.4
