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

- [x] Public GitHub repo created (MIT licence, README, default branch `main`)
- [x] `.github/workflows/ci.yml` runs on `pull_request` and `push: main`
- [x] CI job runs (in this order, all must pass): `npm ci`, `npm run typecheck`, `npm run lint`, `npx prettier --check .`, `npm run test`
- [x] Required status checks configured on `main` branch protection so PRs cannot merge while red
- [x] Branch protection requires at least one approving review on PRs
- [x] Dependabot config (`.github/dependabot.yml`) enabled for `npm` (weekly) and `github-actions` (weekly)
- [x] Issue templates: `.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml`, `plugin-proposal.yml`
- [x] PR template (`.github/pull_request_template.md`) with checklist (tests added, i18n strings updated, docs updated, CHANGELOG entry)
- [x] CI runs on Node 22 (matches `.nvmrc`); cache `~/.npm` for speed

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
- [x] Manual: open a PR with all clean → CI passes (verified on push to `main`, run 25604823166)
- [x] Manual: confirm Dependabot opens a sample PR within a week — Dependabot PRs opened immediately after first push
- [ ] Branch protection blocks merging when `ci` is red

---

## Completion Notes

**Completed:** 2026-05-09

**Deviations from spec:**
- Node version updated from 20 to **22.22.2** (Node 22 LTS "Jod") in `.nvmrc` — architecture spec mandates Node 22; Node 20 entered maintenance-only in April 2026.
- Repo created as **private** initially, then made public to enable branch protection rules (free plan restriction).
- Branch protection set via `gh api` rather than web UI.

**Issues encountered:**
- `bmad/config.yaml` was not prettier-formatted; fixed in follow-up commit `b5a60e5` before CI went green.
- `gh api --field` cannot pass nested JSON objects; resolved by using `--input -` with a heredoc.

**Remaining manual checks:**
- Verify CI fails correctly on a bad PR (lint/typecheck gates) — deferred to first real feature PR.
- Add repo URL to `package.json#repository` and root README when repo is stable (noted for STORY-19.5).
