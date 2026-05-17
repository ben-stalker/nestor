# STORY-14.4: Alerts API + WebSocket events

**Epic:** EPIC-14: Alert System
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** S (1d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** REST and WS endpoints so the UI can render alerts in real time
**So that** dismissals reflect immediately

---

## Acceptance Criteria

- [ ] `GET /api/v1/alerts` returns active (non-dismissed) alerts, newest first, scoped to active profile
- [ ] `POST /api/v1/alerts/:id/dismiss` calls `AlertEngine.dismiss(id)` → 204
- [ ] `GET /api/v1/alerts/badge-counts` returns `{ home: 0, calendar: 1, house: 2, ...}` from `AlertEngine.badgeCounts`
- [ ] WebSocket server broadcasts `{ type: 'alert:new', alert }` and `{ type: 'alert:dismissed', id }` on engine events
- [ ] Client `useAlerts()` hook (TanStack Query) refetches on `alert:*` WS frames
- [ ] Permissions: any authenticated profile can read; only the alert owner or admin can dismiss
- [ ] Unit + Supertest integration tests

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/alerts.ts`
- `server/src/index.ts` — mount router
- `client/src/alerts/api.ts` — `useAlerts`, `useDismissAlert`, `useBadgeCounts`
- `client/src/alerts/wsListener.ts` — invalidates queries on WS frames
- `server/tests/routes/alerts.test.ts`

### Implementation steps

1. Route file:
```ts
router.get('/', requireProfile, async (req, res) => {
  const alerts = await alertRepo.findActive({ profileId: req.profile.id });
  res.json(alerts);
});
router.post('/:id/dismiss', requireProfile, async (req, res) => {
  const alert = await alertRepo.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'not found' });
  if (alert.profile_id && alert.profile_id !== req.profile.id && req.profile.type !== 'admin') return res.status(403).json({ error: 'forbidden' });
  await alertEngine.dismiss(alert.id);
  res.status(204).end();
});
router.get('/badge-counts', requireProfile, (_req, res) => res.json(alertEngine.badgeCounts()));
```
2. WS server already subscribes (STORY-14.2) — verify message shape.
3. Client `useAlerts`: TanStack Query fetching `/api/v1/alerts`, stale 30s.
4. Client `wsListener`: on mount, subscribe to `useWebSocket()` (STORY-1.10); on `alert:new`/`alert:dismissed`, call `qc.invalidateQueries({ queryKey: ['alerts'] })` and `['alerts','badge-counts']`.
5. Tests: Supertest GET returns alerts; POST dismiss → 204; second GET excludes dismissed; permission denials.

### Key technical details

- Alerts are user-visible — dismiss endpoint must be idempotent.
- `findActive` should also filter `profile_id IS NULL OR profile_id = req.profile.id` so household-wide alerts are visible to everyone.
- WS frames are JSON; client should defensively ignore unknown types.
- Badge counts fed into the navbar (STORY-2.7) Zustand store via the same hook.

---

## Dependencies

- **Blocked by:** STORY-14.2, STORY-2.3
- **Blocks:** STORY-3.6 (alerts strip on home), STORY-14.6 (severity colour + nav badges)

---

## Test Checklist

- [ ] Unit: GET returns active only
- [ ] Unit: dismiss as owner → 204
- [ ] Unit: dismiss other profile's alert as non-admin → 403
- [ ] Unit: dismiss household alert (profile_id null) as any profile → 204
- [ ] Unit: WS frame triggers client refetch (test with mock socket)
- [ ] Unit: badge-counts endpoint returns object with mode keys

---

## Notes

- Strict pagination not needed — household alert volume is low.
- WS frame `id` is the alert ID for `alert:dismissed` so the client can optimistically remove without refetching if desired.
