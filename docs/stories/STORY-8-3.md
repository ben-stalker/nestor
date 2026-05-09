# STORY-8.3: Bin schedule CRUD UI + day-card icons

**Epic:** EPIC-8: House Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to configure my bin schedule with colour, icon, frequency
**So that** the carousel shows bins on the right days

---

## Acceptance Criteria

- [ ] Bin admin page lists all bin types with add/edit/delete buttons
- [ ] Add/edit form: name, colour picker, icon picker, day of week, frequency (weekly/fortnightly/4-weekly), anchor date, bank-holiday-shift toggle, alert windows
- [ ] Coloured bin icon shows on relevant home-carousel day cards (consumed by STORY-3.4)
- [ ] Endpoint `GET /api/v1/bin-schedules/upcoming?days=14` returns `[{ schedule, dates: [...] }]` rolling list
- [ ] House page shows "Next 14 days of collections" list
- [ ] Permission: admin only for create/update/delete

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/bins.ts`
- `client/src/house/BinAdmin.tsx`
- `client/src/house/BinForm.tsx`
- `client/src/house/UpcomingBins.tsx`
- `client/src/house/binIcons.ts` — list of available icons
- `client/src/api/bins.ts`
- `server/tests/routes/bins.test.ts`

### Implementation steps

1. Routes:
```ts
router.get('/', requireProfile, async (req, res) => res.json(await binRepo.list()));
router.post('/', requireAdmin, async (req, res) => { /* validate + create */ });
router.patch('/:id', requireAdmin, ...);
router.delete('/:id', requireAdmin, ...);
router.get('/upcoming', requireProfile, async (req, res) => {
  const days = Number(req.query.days ?? 14);
  const schedules = await binRepo.list({ active: true });
  const horizon = addDays(new Date(), days);
  const result = schedules.map(s => ({ schedule: s, dates: nextCollections(s, new Date(), 10, holidays).filter(d => d <= horizon) }));
  res.json(result);
});
```
2. Client form:
   - Colour picker (12-colour palette).
   - Icon picker grid (recycle, food, glass, garden, general).
   - Day-of-week select.
   - Frequency radio (weekly / fortnightly / 4-weekly).
   - Anchor date (calendar picker).
   - Bank-holiday-shift toggle (default on).
   - Alert checkboxes (evening before / morning of) + audio chime toggle.
3. Upcoming list grouped by date with coloured icons next to each bin.
4. Day-card markers: home carousel queries `/bin-schedules/upcoming?days=7` and renders icons for each day's bins (this is the contract for STORY-3.4).
5. Tests: POST creates; permission denial for non-admin; upcoming returns expected dates.

### Key technical details

- PRD §14.
- Bin colours: usual UK colours (green=garden, brown=food, blue=recycling, black=general); but admin can set anything — colour is just a hex.
- Icons: small set of SVG components (`Recycle`, `Apple`, `Bottle`, `Leaf`, `Trash`); add as needed.
- Audio chime tie-in: STORY-14.5 looks at this flag at alert time.

---

## Dependencies

- **Blocked by:** STORY-8.2, STORY-3.4 (uses upcoming endpoint contract)
- **Blocks:** STORY-8.4 (alerts) — though sequence-flexible

---

## Test Checklist

- [ ] Unit: GET upcoming returns dates within window
- [ ] Unit: POST as admin creates schedule
- [ ] Unit: POST as non-admin → 403
- [ ] RTL: form submits, list shows new bin
- [ ] RTL: edit modifies in place
- [ ] RTL: delete confirms then removes
- [ ] Manual: home carousel shows bin icons on collection days

---

## Notes

- Bin colours used both on the icon and the day-card chip — the same hex.
- Future: import council schedule from a local-authority API — community plugin scope.
