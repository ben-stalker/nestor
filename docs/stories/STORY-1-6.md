# STORY-1.6: Vite + React + Tailwind frontend bootstrap

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a working Vite-built React SPA served by Express in production and via Vite dev server in development
**So that** UI work can begin

---

## Acceptance Criteria

- [ ] `client/vite.config.ts` configured with `@vitejs/plugin-react`, alias `@/` → `client/src/`, dev server port 5173, dev proxy `/api` and `/ws` → `http://localhost:3000`
- [ ] Tailwind CSS configured with `tailwind.config.cjs` content paths `./client/index.html` and `./client/src/**/*.{ts,tsx}`, PostCSS pipeline (`postcss.config.cjs` with `tailwindcss` and `autoprefixer`)
- [ ] `client/src/main.tsx` renders `<App />` into `#root`
- [ ] `client/src/App.tsx` shows a "Nestor" splash with the warm-white background per design `home_.png` (off-cream `#FBF5EC`)
- [ ] Dev: `npm run dev` runs Express (port 3000) + Vite (port 5173) concurrently; visiting `http://localhost:5173` shows the splash; API requests via the proxy reach Express
- [ ] Production: `npm run build` outputs to `client/dist/`; Express serves `client/dist/` as static files (with SPA fallback to `index.html` for non-API paths)
- [ ] React Router v6 installed; root route registered; placeholder `<Outlet />` mounts
- [ ] Lighthouse score on the placeholder splash, served by Vite on localhost: Performance > 90

---

## Technical Implementation

### Files to create / modify

- `client/index.html`
- `client/vite.config.ts`
- `client/tailwind.config.cjs`
- `client/postcss.config.cjs`
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/index.css` — Tailwind directives + base CSS custom properties
- `client/src/router.tsx` — placeholder router
- `server/src/index.ts` — extend to serve `client/dist` and SPA fallback when `NODE_ENV=production`
- Root `package.json` — add `dev` script using `concurrently` or `npm-run-all` to spawn server and client dev servers

### Implementation steps

1. In the `client/` workspace, install `react`, `react-dom`, `@types/react`, `@types/react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.
2. Create `client/index.html` with `<div id="root"></div>` and `<script type="module" src="/src/main.tsx"></script>`.
3. Configure `vite.config.ts`: `plugins: [react()]`, `resolve.alias: { '@': path.resolve(__dirname, 'src') }`, `server.port: 5173`, `server.proxy: { '/api': 'http://localhost:3000', '/ws': { target: 'ws://localhost:3000', ws: true } }`, `build.outDir: 'dist'`.
4. Initialise Tailwind: `npx tailwindcss init -p` in `client/`. Set `content: ['./index.html', './src/**/*.{ts,tsx}']`. Extend the theme with CSS custom properties so design tokens (STORY-2.5) can override at runtime: `colors: { background: 'var(--color-bg)', surface: 'var(--color-surface)', accent: 'var(--color-accent)' }`.
5. `client/src/index.css`: `@tailwind base; @tailwind components; @tailwind utilities;` and a `:root` block with placeholder `--color-bg: #FBF5EC; --color-surface: #ffffff; --color-text: #1a1a1a;` (matches the warm-white background in `home_.png`).
6. `client/src/App.tsx`: minimal full-screen flex centring the word "Nestor" in a large display font; class names use Tailwind utilities and the CSS-variable tokens.
7. `client/src/main.tsx`: `createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>)`.
8. `client/src/router.tsx`: `createBrowserRouter([{ path: '/', element: <App /> }])`.
9. In server `src/index.ts`, when `NODE_ENV === 'production'`, mount `express.static(path.join(__dirname, '../../client/dist'))` and add a SPA fallback `app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')))` (registered AFTER all `/api` routes).
10. Root `package.json`: `"dev": "concurrently --names server,client --prefix-colors blue,magenta \"npm run dev -w server\" \"npm run dev -w client\""` and `"build": "npm run build -w client && npm run build -w server"`.
11. Run Lighthouse on the splash served by Vite to confirm Performance > 90.

### Key technical details

- Architecture §Frontend "Key libraries" prescribes the React 18 + Vite stack.
- The Vite dev proxy is essential — it forwards `/api/*` to Express on 3000 so the React app uses relative URLs in both dev and prod.
- Static serving in production must mount AFTER `/api` routes so API 404s don't fall through to `index.html`.
- Tailwind tokens in this story are placeholder; the full design system arrives in STORY-2.5.
- Use CSS custom properties (not just Tailwind theme values) so per-profile text size (STORY-18.4) and night mode (STORY-2.12) can override at runtime by setting them on `<html>`.

---

## Dependencies

- **Blocked by:** STORY-1.4
- **Blocks:** STORY-1.7, STORY-2.5, STORY-2.6, STORY-18.1

---

## Test Checklist

- [ ] Manual: `npm run dev` opens a working dev server with HMR
- [ ] Manual: a `console.log` from `App.tsx` updates on save without losing state
- [ ] Manual: a request to `/api/v1/health` from the browser is proxied to Express and returns 200
- [ ] Manual: `npm run build` produces `client/dist/index.html` with hashed asset filenames
- [ ] Manual: in production mode (`NODE_ENV=production node server/dist/index.js`), visiting `http://localhost:3000/` shows the splash; `/api/v1/health` returns JSON
- [ ] Manual: SPA fallback — `http://localhost:3000/some-deep-route` returns `index.html`, NOT 404
- [ ] Lighthouse Performance > 90 on the splash on localhost

---

## Notes

- Bundle splitting and lazy-loaded routes per Architecture §Performance arrive incrementally — this story just gets the basic SPA running.
- Inter typeface is self-hosted in `client/public/fonts/` per STORY-2.5; for now the splash can use system sans-serif.
