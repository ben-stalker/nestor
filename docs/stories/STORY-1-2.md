# STORY-1.2: GitHub repository and CI pipeline

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** S (1d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** maintainer
**I want** a public GitHub repository with CI running on every PR
**So that** quality gates are enforced and the project is open to contribution

---

## Acceptance Criteria

- [ ] Public GitHub repo created (MIT licence, README, default branch `main`)
- [ ] `.github/workflows/ci.yml` runs on `pull_request` and `push: main`
- [ ] CI job runs (in this order, all must pass): `npm ci`, `npm run typecheck`, `npm run lint`, `npx prettier --check .`, `npm run test`
- [ ] Required status checks configured on `main` branch protection so PRs cannot merge while red
- [ ] Branch protection requires at least one approving review on PRs
- [ ] Dependabot config (`.github/dependabot.yml`) enabled for `npm` (weekly) and `github-actions` (weekly)
- [ ] Issue templates: `.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml`, `plugin-proposal.yml`
- [ ] PR template (`.github/pull_request_template.md`) with checklist (tests added, i18n strings updated, docs updated, CHANGELOG entry)
- [ ] CI runs on Node 20 (matches `.nvmrc`); cache `~/.npm` for speed

---

## Technical Implementation

### Files to create / modify

- `.github/workflows/ci.yml` — main CI workflow
- `.github/dependabot.yml`
- `.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml`, `plugin-proposal.yml`
- `.github/pull_request_template.md`

### Implementation steps

1. Create the repo on GitHub (via `gh repo create` or web UI), MIT licence, push initial commit from STORY-1.1.
2. Author `.github/workflows/ci.yml` with `actions/checkout@v4`, `actions/setup-node@v4` (`node-version-file: '.nvmrc'`, `cache: 'npm'`), then run typecheck → lint → prettier check → tests in sequence on `ubuntu-latest`.
3. Add `.github/dependabot.yml` with `package-ecosystem: npm` (root) and `package-ecosystem: github-actions` (`/`), schedule weekly.
4. Author issue templates as YAML form templates per GitHub's `ISSUE_TEMPLATE/*.yml` schema (bug: title, environment, steps, expected, actual; feature: problem, proposal, scope; plugin-proposal: name, capabilities, target API, risk).
5. Author PR template with markdown checkboxes.
6. Configure branch protection on `main`: require status checks `ci` to pass, require 1 approval, require linear history, no force pushes.
7. Confirm CI green on a no-op PR.

### Key technical details

- Architecture §"CI/CD Pipeline" describes the ordered checks.
- Playwright E2E job is intentionally NOT added here — that arrives in STORY-20.4 once tests exist.
- Lighthouse CI is added in STORY-20.5; release pipeline in STORY-20.8.
- Use `actions/setup-node@v4` with `node-version-file: '.nvmrc'` so version stays in sync with local dev.
- Pin all third-party actions to a major version (`@v4`); avoid `@latest`.

---

## Dependencies

- **Blocked by:** STORY-1.1
- **Blocks:** STORY-20.5, STORY-20.6, STORY-20.8

---

## Test Checklist

- [ ] Manual: open a PR with an intentional lint error → CI fails on lint step
- [ ] Manual: open a PR with a TypeScript error → CI fails on typecheck step
- [ ] Manual: open a PR with all clean → CI passes
- [ ] Manual: confirm Dependabot opens a sample PR within a week (or trigger manually via `gh dependabot update`)
- [ ] Branch protection blocks merging when `ci` is red

---

## Notes

- Repo URL goes in `package.json#repository`, the install script (STORY-19.5), and root README.
- Branch protection requires admin permissions on the repo — coordinate with the repo owner.
