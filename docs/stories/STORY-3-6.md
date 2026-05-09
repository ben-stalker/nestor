# STORY-3.6: Alerts strip on home

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a horizontal strip of dismissible alerts above the carousel
**So that** I see urgent things first

---

## Acceptance Criteria

- [ ] `<AlertsStrip>` reads from `useAlerts()` (TanStack Query against `/api/v1/alerts`)
- [ ] Each alert card: severity colour bar, icon, message, dismiss "×" button
- [ ] Tap alert → optional deep link (e.g. bin alert → `/house`, vehicle reminder → `/vehicles`)
- [ ] Dismiss → optimistic remove + `POST /alerts/:id/dismiss` (rollback on failure)
- [ ] WebSocket `alert:new` and `alert:dismissed` triggers refetch via wsListener (STORY-14.4)
- [ ] Empty state: strip hides itself entirely (no skeleton residue)
- [ ] Severity colours from STORY-14.6 tokens (red/amber/blue/green)
- [ ] Horizontal scroll if more than fit; reduced-motion respected

---

## Technical Implementation

### Files to create / modify

- `client/src/home/AlertsStrip.tsx`
- `client/src/alerts/AlertCard.tsx`
- `client/src/alerts/api.ts` — extend with `useDismissAlert` mutation (optimistic)
- `client/tests/home/AlertsStrip.test.tsx`

### Implementation steps

1. `<AlertsStrip>`:
```tsx
const { data: alerts = [] } = useAlerts();
if (alerts.length === 0) return null;
return (
  <div className="flex gap-3 overflow-x-auto">
    {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
  </div>
);
```
2. `<AlertCard>`:
   - Severity-coloured left border (4px) using token classes (e.g. `border-l-alert-urgent`).
   - Icon based on `source_module` (calendar/house/etc.).
   - Message (already i18n'd at engine; passes through).
   - Dismiss button (44×44 TouchTarget).
   - Tap card → if `deep_link` present, `useNavigate()` to it.
3. `useDismissAlert` optimistic update:
```ts
useMutation({
  mutationFn: (id) => api.post(`/alerts/${id}/dismiss`),
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: ['alerts'] });
    const prev = qc.getQueryData(['alerts']);
    qc.setQueryData(['alerts'], old => old.filter(a => a.id !== id));
    return { prev };
  },
  onError: (_err, _id, ctx) => qc.setQueryData(['alerts'], ctx.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
});
```
4. WS-driven refetch handled by listener already wired in STORY-14.4.
5. Tests: render with mock alerts, dismiss removes optimistically, network failure rolls back.

### Key technical details

- PRD §21 alerts.
- Empty state hides element to keep layout clean — no "no alerts" placeholder.
- Deep links: alerts carry an optional `deep_link` string set by their source module.
- Severity colours sourced from CSS variables (STORY-14.6 sets up tokens).

---

## Dependencies

- **Blocked by:** STORY-3.2, STORY-14.4
- **Blocks:** STORY-14.6 (badge counts uses same data)

---

## Test Checklist

- [ ] RTL: renders one card per alert
- [ ] RTL: tap dismiss → card removed
- [ ] RTL: failed dismiss → card returns
- [ ] RTL: tap alert with deep_link → navigation called
- [ ] RTL: empty alerts → strip not rendered
- [ ] Manual: WS `alert:new` causes new card to appear without refresh

---

## Notes

- Severity icons can be a simple Lucide set — pick: alert-triangle (urgent), alert-circle (warning), info (info), check-circle (success).
- A small "Dismiss all" affordance is a P2 idea.
