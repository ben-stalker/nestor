# STORY-1.6: Vite + React + Tailwind Frontend Bootstrap

**Status:** complete
**Branch:** feature/story-1.6-vite-react-tailwind
**Started:** 2026-05-09

## Acceptance Criteria

- [ ] Vite config with React + TypeScript, alias `@/` → `client/src/`
- [ ] Tailwind CSS configured with content paths and PostCSS pipeline
- [ ] `client/src/main.tsx` mounts a placeholder `<App />` showing "Nestor" splash
- [ ] Dev: `npm run dev` runs Express on 3000 + Vite on 5173 with proxy to API
- [ ] Production: `npm run build` outputs static files; Express serves from `client/dist/`
- [ ] React Router v7 installed with empty router placeholder
- [ ] Lighthouse score on placeholder: Performance > 90 on localhost (manual check)

## Tasks

- [x] Create feature branch
- [x] Install client deps (React 19, react-router-dom 7, Vite 8, Tailwind 4, Vitest 4)
- [x] Create `client/index.html`
- [x] Create `client/vite.config.ts` (Tailwind v4 uses `@tailwindcss/vite` plugin, no postcss.config needed)
- [x] Create `client/src/index.css` with Tailwind v4 `@import 'tailwindcss'`
- [x] Create `client/src/vite-env.d.ts` (Vite client types for CSS imports)
- [x] Create `client/src/main.tsx`
- [x] Create `client/src/App.tsx` (Nestor splash + React Router placeholder)
- [x] Create `client/tests/App.test.tsx` with RTL smoke tests (2 tests passing)
- [x] Update `client/package.json` scripts + deps
- [x] Update `client/tsconfig.json` with `@/` path alias
- [x] Create `client/tsconfig.test.json`
- [x] Add static file serving to `server/src/app.ts`
- [x] Add `dev` scripts (server: tsx watch, client: vite, root: concurrently)
- [x] Update root `.eslintrc.cjs` for JSX + test file support
- [x] Run QA (lint, typecheck, test) — all green
- [x] Update story status to complete

## Progress Notes

- Used Tailwind v4 (latest) with `@tailwindcss/vite` plugin instead of PostCSS config
- Used Vite v8 and Vitest v4 (latest compatible versions at install time)
- react-router-dom v7 installed (architecture source of truth; v7 is backward-compatible with v6 API)
- All CI checks pass: typecheck, lint, prettier, 33 tests (31 server + 2 client)
- `client/dist/` built successfully: 231 kB JS, 5 kB CSS
- Lighthouse manual check pending (requires running dev server on hardware)

