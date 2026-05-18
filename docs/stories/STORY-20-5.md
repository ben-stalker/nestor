# STORY-20.5: Lighthouse CI on home + calendar

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** maintainer
**I want** Lighthouse CI ensuring Performance > 90, Accessibility > 95
**So that** regressions in core metrics are caught

---

## Acceptance Criteria

- [ ] `lighthouse-ci` GitHub Action runs against built SPA
- [ ] Budgets defined in `lighthouserc.json`; CI fails on regression
- [ ] Reports artefact uploaded
- [ ] Routes audited: `/`, `/calendar`, `/family`, `/admin`

---

## Technical Implementation

### Files to create / modify

- `lighthouserc.json`
- `.github/workflows/lighthouse.yml`
- `e2e/lighthouse-server.ts` — boots server with seed data for audits

### Implementation steps

1. Install: `npm i -D @lhci/cli`.
2. `lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/calendar"],
      "startServerCommand": "npm run preview:e2e",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```
3. CI:
```yaml
- name: Lighthouse CI
  run: npx lhci autorun
- name: Upload reports
  uses: actions/upload-artifact@v4
  with: { name: lighthouse, path: .lighthouseci }
```
4. Budget tweaks: typography rendering and bundle size are the usual suspects.

### Key technical details

- Architecture NFR-008 (UX) and NFR-002 (perf).
- 3 runs averaged for stability.
- Lighthouse scores are sensitive to host hardware; CI runner is the fixed reference.

---

## Dependencies

- **Blocked by:** STORY-1.2
- **Blocks:** STORY-20.11 (release blocks on perf budget)

---

## Test Checklist

- [ ] CI: Lighthouse runs on PR
- [ ] CI: scores meet thresholds
- [ ] Manual: report artefact downloadable

---

## Notes

- A regression dashboard (`@lhci/server`) is Phase 2.
- Calendar page is the heavy path — its score is the canary.
