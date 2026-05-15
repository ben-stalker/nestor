# STORY-7.6: Health log endpoints + UI (general)

**Epic:** EPIC-7: Family Module — Children & Health
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** L (3d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** parent
**I want** to log medicine, temperature, and symptoms for any family member
**So that** I have a record to share with a GP

---

## Acceptance Criteria

- [ ] `GET /api/v1/health-log/:profileId?logType=&from=&to=` returns log entries
- [ ] `POST /api/v1/health-log/:profileId` creates entry; validated by `log_type`-specific Zod schema
- [ ] `PATCH/DELETE /api/v1/health-log/entries/:id`
- [ ] UI: timeline view per profile, filter by type
- [ ] Add modal: type-specific fields:
  - medicine: name, dose, reason
  - temperature: value + unit
  - symptom: free text
  - vaccination: name + lot number
- [ ] Export-as-PDF for last 30 days (admin only) via `pdf-lib`
- [ ] Permission: only admin or self can view; cross-profile forbidden for non-admin

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/healthLog.ts`
- `server/src/services/HealthLogService.ts`
- `server/src/types/healthLog.ts` — discriminated union of `log_type` schemas
- `server/src/services/healthPdf.ts` — pdf-lib export
- `client/src/family/HealthLog.tsx`
- `client/src/family/HealthLogAddModal.tsx`
- `server/tests/routes/healthLog.test.ts`

### Implementation steps

1. Zod discriminated union:
```ts
const Medicine = z.object({ log_type: z.literal('medicine'), name: z.string(), dose: z.string(), reason: z.string().optional() });
const Temperature = z.object({ log_type: z.literal('temperature'), value: z.number(), unit: z.enum(['c','f']) });
const Symptom = z.object({ log_type: z.literal('symptom'), text: z.string() });
// ...
export const HealthLogInput = z.discriminatedUnion('log_type', [Medicine, Temperature, Symptom, /*…*/]);
```
2. Routes:
```ts
router.post('/:profileId', requireProfile, requireSelfOrAdmin('profileId'), async (req, res) => {
  const input = HealthLogInput.parse(req.body);
  const id = await healthLogRepo.create({ profile_id: Number(req.params.profileId), log_type: input.log_type, data_json: JSON.stringify(input), logged_at: Date.now() });
  res.status(201).json({ id });
});
router.get('/:profileId/export.pdf', requireAdmin, async (req, res) => {
  const entries = await healthLogRepo.listInRange(Number(req.params.profileId), thirtyDaysAgo, now);
  const pdf = await renderHealthPdf(entries);
  res.type('application/pdf').send(pdf);
});
```
3. `requireSelfOrAdmin` helper: 403 unless `req.profile.id === Number(req.params.profileId)` or admin.
4. Client `<HealthLog>`: timeline list per profile + type filter chips + add CTA.
5. `<HealthLogAddModal>` renders type-specific form fields based on `log_type` selection.
6. PDF export: minimalist layout — heading + per-entry rows; pdf-lib for zero-install rendering.
7. Tests: each log_type validation; permission: child cannot read another child; admin can; PDF export returns 200 with content-type pdf.

### Key technical details

- Cross-profile read denied for non-admin.
- Temperature unit conversion handled at display via `formatTemperature`.
- PDF export is intentionally simple — for sharing with a GP, not legal records.
- Log entries are immutable in spirit; PATCH/DELETE allowed but should be rare.

---

## Dependencies

- **Blocked by:** STORY-7.1
- **Blocks:** STORY-7.7 (baby tracking reuses table), STORY-7.9 (vaccination reminders), STORY-7.11 (mood log)

---

## Test Checklist

- [ ] Unit: medicine log validation
- [ ] Unit: temperature log validation
- [ ] Unit: child reading own log → 200
- [ ] Unit: child reading sibling's log → 403
- [ ] Unit: admin reading any → 200
- [ ] Unit: PDF export returns valid PDF binary
- [ ] RTL: add modal shows type-specific fields
- [ ] RTL: timeline filter by type

---

## Notes

- The same table (`health_logs`) is used by baby tracking (`feed`/`nappy`/`sleep` log_types) and vaccinations.
- A future "share with GP" QR code is nice-to-have; out of scope.

---

## Progress

**Completed:** 2026-05-15

Implemented `routes/healthLog.ts` (GET/POST/PATCH/DELETE) with `requireSelfOrAdmin` permission guard, `services/healthPdf.ts` using pdf-lib for 30-day PDF export, and `types/healthLog.ts` Zod discriminated union covering all log types. Built `HealthLog.tsx` (timeline with type-filter chips) and `HealthLogAddModal.tsx` (type-specific dynamic form fields). `healthLog.test.ts` covers 9 server tests (validation per type, permission checks, PDF export); `HealthLog.test.tsx` covers 4 client RTL tests for modal fields and timeline filtering.
