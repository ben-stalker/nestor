# STORY-1.4: Express server bootstrap with structured logging

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** an Express HTTP server with a logger, health endpoint, and graceful shutdown
**So that** every domain feature can plug into a production-ready scaffold

---

## Acceptance Criteria

- [ ] `server/src/index.ts` bootstraps Express on port 3000, configurable via `NESTOR_PORT`
- [ ] `app.use(express.json({ limit: '10mb' }))` configured (10MB allows recipe/photo body)
- [ ] Request ID middleware assigns `req.id = randomUUID()` and writes `X-Request-Id` response header
- [ ] Centralised error middleware returns `{ error: string, code: string, details?: object }` shape
- [ ] `pino` logger configured with structured JSON to stdout; level overridable via `NESTOR_LOG_LEVEL` env (default `info`)
- [ ] Each request logs `{ requestId, method, path, status, duration_ms }` on completion via `pino-http`
- [ ] `GET /health` returns `200 { status: 'ok', db: 'ok'|'fail', uptime: <seconds>, version: <pkg.version> }`
- [ ] SIGTERM and SIGINT handlers drain in-flight requests (HTTP server `close()`) then close the SQLite connection cleanly
- [ ] `process.on('uncaughtException')` and `process.on('unhandledRejection')` log the error and exit non-zero (systemd will restart)
- [ ] Supertest integration test asserts `GET /health` returns 200 with the expected shape

---

## Technical Implementation

### Files to create / modify

- `server/src/index.ts` — entry point: bootstrap Express, run migrations, start listening
- `server/src/app.ts` — exports `createApp()` that returns the Express instance (testable without listening)
- `server/src/middleware/requestId.ts`
- `server/src/middleware/errorHandler.ts`
- `server/src/middleware/logger.ts` — wraps `pino-http`
- `server/src/utils/logger.ts` — exports `logger` (pino instance)
- `server/src/routes/health.ts`
- `server/tests/health.test.ts`

### Implementation steps

1. Install `express`, `@types/express`, `pino`, `pino-http`, `pino-pretty` (dev), `supertest`, `@types/supertest`.
2. Author `server/src/utils/logger.ts` exporting a single `pino` instance with JSON output (use `pino-pretty` only when `NODE_ENV !== 'production'`).
3. Author `server/src/app.ts` with `createApp(): Express` that wires middleware in order: requestId → pino-http → `express.json` → routes → errorHandler.
4. `server/src/middleware/requestId.ts`: generate `randomUUID()` from `node:crypto`, attach to `req.id` and `X-Request-Id` response header.
5. `server/src/middleware/errorHandler.ts`: `(err, req, res, next) => res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? 'INTERNAL_ERROR', details: err.details })`. Log with `req.log.error(err)`.
6. `server/src/routes/health.ts`: returns shape per AC, querying `SELECT 1` against `getDb()` to test DB.
7. `server/src/index.ts`: imports `createApp`, calls `runMigrations(getDb())` (from STORY-1.3), starts `app.listen(NESTOR_PORT)`. Registers SIGTERM/SIGINT handlers that call `server.close()` + `db.close()` + `process.exit(0)`.
8. Register process-level uncaught handlers that log and `process.exit(1)`.
9. Author Supertest test in `server/tests/health.test.ts` that imports `createApp()` and asserts `/health` shape.

### Key technical details

- Architecture §"Component 1: Express HTTP Server" and NFR-002 (24/7 reliability) drive these choices.
- pino is lightweight and structured — see Architecture §Backend "Key libraries".
- `NESTOR_PORT` default `3000`. Vite dev proxy (STORY-1.6) will target this.
- The version field in `/health` reads from `pkg.version` via `import { version } from '../package.json'` (set `resolveJsonModule: true` in tsconfig).
- No `cors` middleware for MVP (Architecture: LAN-only, served from same origin via Vite proxy in dev).
- Graceful shutdown: `server.close(callback)` only resolves once all open connections have ended; give it a 10s timeout then force exit.

---

## Dependencies

- **Blocked by:** STORY-1.3
- **Blocks:** STORY-1.6, STORY-1.9, STORY-1.10, STORY-1.11, STORY-2.2 onwards

---

## Test Checklist

- [ ] Unit/integration: `GET /health` returns 200 with `status: 'ok'` and `db: 'ok'`
- [ ] Unit: forcing `getDb().close()` then calling `/health` returns `db: 'fail'` (or appropriate error)
- [ ] Unit: error middleware returns the documented JSON shape for thrown errors
- [ ] Unit: every response includes `X-Request-Id` header
- [ ] Manual: `kill -TERM <pid>` triggers clean shutdown (no "server still running" error)
- [ ] Manual: `NESTOR_LOG_LEVEL=debug npm run dev` shows debug logs

---

## Notes

- The Express app must be exportable without auto-listening so Supertest and other tests can drive it.
- WebSocket scaffold (STORY-1.10) attaches to this same HTTP server.
- The 10MB JSON body limit is sized for base64 photo uploads; multer (image upload) lands in STORY-5.2.
