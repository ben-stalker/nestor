# STORY-14.2: Alert engine service

**Epic:** EPIC-14: Alert System
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** an `AlertEngine` service that other modules call to push alerts
**So that** there is one alert pipeline

---

## Acceptance Criteria

- [ ] `AlertEngine.push({ source, type, severity, message, profileId?, navModeBadge?, deepLink? })` persists via `AlertRepository.push` (which dedupes per day) and emits `alert:new` on the event bus
- [ ] WebSocket server (STORY-1.10) subscribes to `alert:new` and broadcasts `{ type:'alert:new', alert }` to all clients
- [ ] `AlertEngine.dismiss(id)` sets dismissed=true, emits `alert:dismissed`, broadcasts via WS
- [ ] In-memory unread-count cache keyed by `nav_mode_badge` for fast badge queries (rebuilt lazily; invalidated on push/dismiss)
- [ ] `AlertEngine.badgeCounts()` returns `{ home: 0, calendar: 1, ... }` from cache (≤1ms)
- [ ] Service is a singleton wired in `server/src/index.ts`
- [ ] Unit tests cover dedup, broadcast, dismiss, badge cache invalidation

---

## Technical Implementation

### Files to create / modify

- `server/src/services/AlertEngine.ts`
- `server/src/index.ts` — instantiate and inject
- `server/src/ws/server.ts` — subscribe to `alert:new`/`alert:dismissed`
- `server/tests/services/AlertEngine.test.ts`

### Implementation steps

1. Class skeleton:
```ts
export class AlertEngine {
  constructor(private repo: AlertRepository, private bus: EventBus) {}
  private badgeCache: Record<string, number> | null = null;

  async push(input: AlertInput) {
    const alert = await this.repo.push(input); // returns null if deduped
    if (!alert) return null;
    this.invalidateCache();
    this.bus.emit('alert:new', alert);
    return alert;
  }

  async dismiss(id: number) {
    await this.repo.dismiss(id);
    this.invalidateCache();
    this.bus.emit('alert:dismissed', { id });
  }

  badgeCounts() {
    if (!this.badgeCache) this.rebuildCache();
    return this.badgeCache!;
  }

  private invalidateCache() { this.badgeCache = null; }
  private rebuildCache() { /* SELECT nav_mode_badge, COUNT(*) FROM alerts WHERE dismissed=0 GROUP BY nav_mode_badge */ }
}
```
2. Wire into bootstrap so all modules import `getAlertEngine()`.
3. Update `ws/server.ts` to subscribe to `alert:new` and `alert:dismissed`; broadcast via existing `broadcast(msg)` helper.
4. `Alert` type matches schema from STORY-14.1.
5. Tests: mock repo + spy on bus; assert push emits when not deduped; assert dismiss emits; assert badge cache invalidates.

### Key technical details

- Architecture §"Component 5: Alert Engine".
- Dedup logic lives in the repository (STORY-14.1) — engine just relays.
- `nav_mode_badge` is set by the caller (e.g. bin alert sets `'house'`); falls back to `source` if absent.
- The cache is intentionally simple (full rebuild on invalidation) — alert count is small. If profiling shows hot path, switch to incremental.
- Severity values: `urgent` | `warning` | `info` | `success`.

---

## Dependencies

- **Blocked by:** STORY-14.1, STORY-1.9, STORY-1.10
- **Blocks:** STORY-14.3 (reminder evaluator pushes through engine), STORY-14.4 (REST API), STORY-3.6 (alerts strip), STORY-14.7 (plugin alerts)

---

## Test Checklist

- [ ] Unit: pushing two duplicate alerts in same day → only first persisted, only first emits
- [ ] Unit: dismiss emits `alert:dismissed`
- [ ] Unit: badge cache rebuilds after invalidation
- [ ] Unit: WS server receives broadcast on push (via spy on `broadcast`)
- [ ] Unit: pushing across multiple modules with different `navModeBadge` results in correct badge counts

---

## Notes

- Plugin alerts (STORY-14.7) call `AlertEngine.push` via `pluginContext.pushAlert` — engine identical, source set to `plugin:<id>`.
- Dismissed alerts retained for audit; a future cleanup job (Phase 2) can purge older than 30 days.
