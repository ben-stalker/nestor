# STORY-20.8: Release pipeline (tag → build → release tarball)

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** maintainer
**I want** a tag push to produce a release tarball + checksum + GitHub Release
**So that** the install script can fetch it

---

## Acceptance Criteria

- [ ] `release.yml` GitHub Actions workflow on `v*` tag
- [ ] Builds client + server, runs full test suite, creates tarball
- [ ] Generates SHA256 alongside tarball
- [ ] Updates release notes from CHANGELOG section
- [ ] (Stretch) Tags `latest` Docker image (community contribution)
- [ ] Tarball asset attached to GitHub Release

---

## Technical Implementation

### Files to create / modify

- `.github/workflows/release.yml`
- `scripts/build-release.sh`
- `scripts/extract-changelog.sh`

### Implementation steps

1. Workflow trigger:
```yaml
on: { push: { tags: ['v*'] } }
```
2. Steps:
   - Checkout
   - Setup Node 20
   - `npm ci`
   - `npm run lint && npm run typecheck && npm test`
   - `npm run build` (client + server)
   - `scripts/build-release.sh ${{ github.ref_name }}` produces `nestor-vX.Y.Z.tar.gz` and `.sha256`
   - `scripts/extract-changelog.sh vX.Y.Z` produces release notes
   - `softprops/action-gh-release@v2` with files + body
3. `build-release.sh`:
```bash
#!/bin/bash
set -euo pipefail
TAG=$1
BUILD_DIR=dist/release/$TAG
mkdir -p "$BUILD_DIR"
cp -r server/dist client/dist install plugins package*.json "$BUILD_DIR"
tar -czf "nestor-$TAG.tar.gz" -C dist/release "$TAG"
sha256sum "nestor-$TAG.tar.gz" > "nestor-$TAG.tar.gz.sha256"
```
4. Verify install script (STORY-19.5) downloads from this release.

### Key technical details

- Tag format: `vX.Y.Z` (semver).
- Release body sourced from CHANGELOG `## vX.Y.Z` section.
- Tarball excludes `node_modules`, `tests`, dev deps.
- SHA256 verified by install script + in-app updater (STORY-19.8).

---

## Dependencies

- **Blocked by:** STORY-1.2, STORY-19.5
- **Blocks:** STORY-20.11 (release uses this pipeline)

---

## Test Checklist

- [ ] CI: tag push triggers build
- [ ] CI: tarball + sha256 produced
- [ ] CI: GitHub Release created with body
- [ ] Manual: install script downloads release tarball

---

## Notes

- Docker image push is stretch; community can add later.
- Release notes generated from `## [Unreleased]` rolled into `## vX.Y.Z` on cut.
