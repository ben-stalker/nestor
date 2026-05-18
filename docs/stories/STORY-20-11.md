# STORY-20.11: Release v1.0 (MVP cut)

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** maintainer
**I want** to cut v1.0
**So that** households can install Nestor

---

## Acceptance Criteria

- [ ] All P1 stories merged
- [ ] Soak test passed (STORY-20.9)
- [ ] Install script tested on clean hardware
- [ ] Release notes published
- [ ] Versions: app `1.0.0`, plugin API `1.0.0`
- [ ] Announcement posted (Discord/forum/blog)

---

## Technical Implementation

### Files to create / modify

- `package.json` — version bump
- `CHANGELOG.md` — Unreleased → v1.0.0
- `plugins/_test-chaos/manifest.json` — set plugin API version
- `docs/release-notes/v1.0.md`
- Git tag `v1.0.0`

### Implementation steps

1. Pre-flight checklist:
   - All P1 stories status `done` in `docs/stories/`
   - CI green on `main`
   - Lighthouse budgets met
   - Network audit clean
   - Soak running ≥ 30 days (STORY-20.9)
   - Install script verified on a clean Ubuntu 24 NUC + Pi 5
2. Version bump:
   - `package.json` (root + workspaces)
   - `app_settings.plugin_api_version=1.0.0`
3. CHANGELOG:
   - Move `## [Unreleased]` to `## [1.0.0] — YYYY-MM-DD`.
   - Add summary intro.
4. Release notes (`docs/release-notes/v1.0.md`):
   - Highlights, install command, hardware tested, known issues, thanks.
5. Tag + push:
```bash
git tag v1.0.0
git push origin v1.0.0
```
   The release pipeline (STORY-20.8) builds and creates the GitHub Release.
6. Post announcement.

### Key technical details

- Release is a process, not code; this story is the gate.
- Plugin API version stamped so future plugins can declare compat.
- Two manual installs (NUC + Pi 5) provide hardware confidence.

---

## Dependencies

- **Blocked by:** all MVP stories
- **Blocks:** —

---

## Test Checklist

- [ ] All P1 stories closed
- [ ] CI green
- [ ] Manual: clean install on NUC succeeds
- [ ] Manual: clean install on Pi 5 succeeds
- [ ] Manual: release notes published

---

## Notes

- Plan a v1.0.1 patch release within 2 weeks for any post-launch fixes.
- Phase 2 starts immediately after with plugin runtime + voice pipeline.
