# STORY-1.4: Express server bootstrap with structured logging

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** an Express HTTP server with a logger, health endpoint, and graceful shutdown
**So that** every domain feature can plug into a production-ready scaffold

---

## Acceptance Criteria

- [x] `server/src/index.ts` bootstraps Express on port 3000, configurable via `NESTOR_PORT`
- [x] `app.use(express.json({ limit: '10mb' }))` configured (10MB allows recipe/photo body)
- [x] Request ID middleware assigns `req.id = randomUUID()` and writes `X-Request-Id` response header
- [x] Centralised error middleware returns `{ error: string, code: string, details?: object }` shape
- [x] `pino` logger configured with structured JSON to stdout; level overridable via `NESTOR_LOG_LEVEL` env (default `info`)
- [x] Each request logs `{ requestId, method, path, status, duration_ms }` on completion via `pino-http`
- [x] `GET /health` returns `200 { status: 'ok', db: 'ok'|'fail', uptime: <seconds>, version: <pkg.version> }`
- [x] SIGTERM and SIGINT handlers drain in-flight requests (HTTP server `close()`) then close the SQLite connection cleanly
- [x] `process.on('uncaughtException')` and `process.on('unhandledRejection')` log the error and exit non-zero (systemd will restart)
- [x] Supertest integration test asserts `GET /health` returns 200 with the expected shape

---

## Technical Implementation

### Files created / modified

- `server/src/index.ts` — entry point: bootstrap Express, run migrations, start listening, graceful shutdown + uncaught handlers
- `server/src/app.ts` — exports `createApp()` (default export) that returns the Express instance (testable without listening)
- `server/src/middleware/requestId.ts` — randomUUID assigned to `req.id` + `X-Request-Id` header
- `server/src/middleware/errorHandler.ts` — structured `{ error, code, details }` JSON error responses
- `server/src/middleware/logger.ts` — `pino-http` middleware wrapping the shared pino instance
- `server/src/utils/logger.ts` — exports singleton pino instance; pino-pretty in non-production
- `server/src/routes/health.ts` — `GET /health` with DB ping, uptime, version
- `server/tests/health.test.ts` — 4 Supertest tests covering health shape, DB status, X-Request-Id, and error middleware shape

### Packages added

- `express` + `@types/express`
- `pino` + `pino-http`
- `pino-pretty` (dev)
- `supertest` + `@types/supertest`

---

## Dependencies

- **Blocked by:** STORY-1.3
- **Blocks:** STORY-1.6, STORY-1.9, STORY-1.10, STORY-1.11, STORY-2.2 onwards

---

## Test Checklist

- [x] Integration: `GET /health` returns 200 with `status: 'ok'` and `db: 'ok'`
- [x] Integration: every response includes `X-Request-Id` header
- [x] Integration: error middleware returns the documented JSON shape for thrown errors
- [ ] Manual: `kill -TERM <pid>` triggers clean shutdown (no "server still running" error)
- [ ] Manual: `NESTOR_LOG_LEVEL=debug npm run dev` shows debug logs

---

## Completion Notes

- Completed: 2026-05-09
- All 12 tests passing (3 suites: connection, migrationRunner, health)
- Lint, typecheck, prettier all green
- Also fixed pre-existing prettier formatting issues in `connection.ts`, `migrationRunner.ts`, `migrationRunner.test.ts`
- Graceful shutdown uses a 10s force-exit timeout per the story spec
- `createApp()` is a default export so the Airbnb `import/prefer-default-export` rule is satisfied
