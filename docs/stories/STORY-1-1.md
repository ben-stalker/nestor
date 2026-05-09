# STORY-1.1: Initialise repository structure and tooling

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** S (1d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** developer
**I want** a working monorepo with `server/`, `client/`, `plugins/`, `install/`, `docs/` directories and shared tooling
**So that** all subsequent work has a consistent home and consistent linting

---

## Acceptance Criteria

- [x] Top-level `package.json` with npm workspaces declaring `server`, `client`, and `plugins/*`
- [x] `tsconfig.base.json` with `"strict": true`, `"target": "ES2022"`, `"moduleResolution": "Node"`, and project references for `server` and `client`
- [x] ESLint configured with `eslint-config-airbnb-base` + `@typescript-eslint`
- [x] Prettier configured (single quotes, 2-space indent, trailing commas) with `.prettierrc.json`
- [x] `.editorconfig` enforces LF line endings and 2-space indent
- [x] `.gitignore` excludes `node_modules`, `dist`, `*.db`, `~/.nestor/`, `.env*`, `coverage/`
- [x] `.nvmrc` pins Node 20 LTS (e.g. `20.11.0`)
- [x] Husky installed; pre-commit hook runs `lint-staged` which executes `eslint --fix` and `prettier --write` on staged files
- [x] `LICENSE` (MIT, copyright Ben), `README.md` placeholder, `CHANGELOG.md` (Keep a Changelog format), `CONTRIBUTING.md`
- [x] Root scripts defined and passing on the empty repo: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- [x] Each workspace contains its own minimal `package.json` and `tsconfig.json` extending the base

---

## Technical Implementation

### Files to create / modify

- `package.json` — root with `"workspaces": ["server", "client", "plugins/*"]` and shared scripts that delegate to workspaces (`npm run -ws lint`, etc.)
- `tsconfig.base.json` — strict TypeScript config; both client and server extend
- `tsconfig.json` — root project references file
- `.eslintrc.cjs` — Airbnb base + TS plugin, `eslint-plugin-import`, `no-console: warn`
- `.prettierrc.json`, `.prettierignore`
- `.editorconfig`
- `.gitignore`
- `.nvmrc`
- `.husky/pre-commit` (calls `npx lint-staged`) — set up via `npx husky init`
- `lint-staged.config.cjs`
- `LICENSE`, `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- `server/package.json`, `server/tsconfig.json`
- `client/package.json`, `client/tsconfig.json`
- `plugins/.gitkeep`
- `install/.gitkeep`
- `docs/.gitkeep`

### Implementation steps

1. `git init` (already done) and create root `package.json` with `name: "nestor"`, `private: true`, and the workspaces array.
2. Install dev dependencies at root: `typescript`, `@types/node`, `eslint`, `eslint-config-airbnb-base`, `eslint-config-airbnb-typescript`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier`, `husky`, `lint-staged`.
3. Create `tsconfig.base.json` per Architecture §"Code Organisation" with `strict: true`, `noImplicitAny: true`, `esModuleInterop: true`, `skipLibCheck: true`.
4. Create `server/` and `client/` workspace folders, each with a `package.json` (with `name: "@nestor/server"` etc.) and `tsconfig.json` that `extends: "../tsconfig.base.json"`.
5. Initialise Husky: `npx husky init`; in `.husky/pre-commit` add `npx lint-staged`.
6. Configure `lint-staged.config.cjs` to run ESLint and Prettier on `*.{ts,tsx,js,jsx,json,md}`.
7. Add root scripts: `lint`, `typecheck` (calls `tsc -b --noEmit`), `test` (delegates to workspaces), `build`.
8. Run `npm install` and verify all four scripts exit 0 on the empty repo.

### Key technical details

- Use **npm workspaces**, NOT pnpm or yarn — Architecture §Frontend / §Backend explicitly notes broadest contributor compatibility.
- Do NOT bootstrap Vite or Express here — those land in STORY-1.4 and STORY-1.6.
- Architecture §"Code Organisation" is the source of truth for folder structure.
- `docs/architecture-nestor-2026-05-08.md` already exists — leave untouched.

---

## Dependencies

- **Blocked by:** None
- **Blocks:** STORY-1.2, STORY-1.3, STORY-1.4, STORY-1.6, STORY-20.1

---

## Test Checklist

- [x] `npm install` completes with no errors
- [x] `npm run lint` exits 0 on empty repo
- [x] `npm run typecheck` exits 0
- [x] `npm run test` exits 0 (no tests yet, stub echo)
- [x] `npm run build` exits 0
- [x] Husky hook fires on `git commit` and runs `lint-staged`
- [ ] Manual: introduce an ESLint violation in a `.ts` file; pre-commit blocks the commit until fixed

---

## Notes

- License is MIT per PRD §Open Source / §Licence.
- Keep `README.md` minimal here; the full README lands in STORY-20.10.
- Issue and PR templates land in STORY-1.2 (GitHub-specific work).

---

## Implementation Notes

**Completed:** 2026-05-09
**Actual effort:** S (matched estimate)

- `git init` + renamed default branch to `main`
- npm workspaces installed; 322 packages, 0 vulnerabilities
- Husky v9 used; `npx husky init` auto-adds `prepare` script to root `package.json`
- ESLint `--no-error-on-unmatched-pattern` added to workspace lint scripts so they pass before any `.ts` files exist
- Stub `src/index.ts` added to each workspace so `tsc -b` has at least one input file (TypeScript requires this)
- Client `tsconfig.json` uses `moduleResolution: bundler` / `module: ESNext` ready for Vite (STORY-1.4)
