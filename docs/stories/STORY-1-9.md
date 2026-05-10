# STORY-1.9: Internal event bus

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** XS (0.5d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** a typed event bus shared across services
**So that** modules can publish/subscribe without circular imports

---

## Acceptance Criteria

- [x] `server/src/core/eventBus.ts` exports a singleton typed EventEmitter
- [x] Declared event map covers (with payload types):
  - `alert:new` → `Alert`
  - `alert:dismissed` → `{ id: number }`
  - `calendar:synced` → `{ accountId: number; eventCount: number }`
  - `plugin:enabled` → `{ pluginId: string }`
  - `plugin:disabled` → `{ pluginId: string }`
  - `plugin:error` → `{ pluginId: string; error: Error }`
  - `voice:status` → `{ status: 'idle' | 'listening' | 'processing' | 'speaking' }`
  - `settings:updated` → `{ keys: string[] }`
- [x] Type-safe `emit<K extends keyof EventMap>(event: K, payload: EventMap[K])`
- [x] Type-safe `on<K>(event: K, listener: (payload: EventMap[K]) => void)`
- [x] `off` and `once` similarly typed
- [x] Errors thrown by listeners are caught + logged via pino, do NOT propagate to other listeners or back to the emitter
- [x] Documented in code comments with usage examples
- [x] Unit tests verify type-safe emit/on, listener isolation on throw

---

## Technical Implementation

### Files to create / modify

- `server/src/core/eventBus.ts`
- `server/src/core/eventBus.types.ts` — the `EventMap` interface
- `server/tests/core/eventBus.test.ts`

### Implementation steps

1. Define `EventMap` in `eventBus.types.ts` with the payload types per AC. Reference `Alert` from `repositories/AlertRepository` (placeholder type — actual repo lands in STORY-14.1; for now declare a local `interface Alert { id: number; … }` OR keep `unknown` and refine when 14.1 lands).
2. Implement a thin wrapper around Node's `EventEmitter`:
```ts
class TypedEventBus extends EventEmitter {
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean { return super.emit(event, payload); }
  on<K extends keyof EventMap>(event: K, listener: (p: EventMap[K]) => void): this { return super.on(event, listener); }
  off<K extends keyof EventMap>(event: K, listener: (p: EventMap[K]) => void): this { return super.off(event, listener); }
  once<K extends keyof EventMap>(event: K, listener: (p: EventMap[K]) => void): this { return super.once(event, listener); }
}
export const eventBus = new TypedEventBus();
```
3. Wrap `super.emit` to catch listener errors: iterate listeners with `try/catch`, log each via `logger.error({ err, event }, 'event listener threw')`. Use a custom dispatch loop instead of `super.emit` for this isolation.
4. Set `eventBus.setMaxListeners(50)` — the alert engine, WebSocket server, scheduler, and plugin manager will all subscribe.
5. Author tests covering ACs.

### Key technical details

- Architecture §"Message / Event Architecture" specifies a Node `EventEmitter` for in-process pub/sub — no Redis, no RabbitMQ.
- This is THE only event bus in the system; future modules import this singleton.
- Listener isolation matters — a buggy plugin alert handler must not break the WebSocket broadcast.
- When STORY-1.10 (WebSocket) lands, it will subscribe to `alert:new`, `alert:dismissed`, `voice:status`, `calendar:synced` and re-broadcast over WS.
- When STORY-1.5's `AppSettingsRepository` writes, it should `eventBus.emit('settings:updated', { keys })` — refactor that call once this story lands.

---

## Dependencies

- **Blocked by:** STORY-1.4
- **Blocks:** STORY-1.10, STORY-14.2, STORY-16.2

---

## Test Checklist

- [x] Unit: typed emit + on round-trips with correct payload type (TS compile check)
- [x] Unit: listener that throws does NOT prevent other listeners from running
- [x] Unit: thrown listener error is logged (mock logger)
- [x] Unit: `once` fires exactly once
- [x] Unit: max listeners not warning at 50

---

## Notes

- Keep the event map in a dedicated file so cross-module usage doesn't pull in unrelated code.
- This is intentionally simple — don't introduce schema validation or async dispatch here; that's gold-plating.
