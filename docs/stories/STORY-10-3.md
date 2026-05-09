# STORY-10.3: Pet health log + vaccination/flea/worming reminders

**Epic:** EPIC-10: Pets Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** pet owner
**I want** to log vaccinations and flea/worming with next-due dates
**So that** I don't miss boosters

---

## Acceptance Criteria

- [ ] `GET /api/v1/pets/:id/health-log?logType=` returns log
- [ ] `POST /api/v1/pets/:id/health-log` creates entry with type-specific Zod
- [ ] Each entry can set `next_due_date` and `reminder_days_before` (default 7)
- [ ] Reminder hook (registered with STORY-14.3) pushes alerts at lead time
- [ ] Active medication daily reminders (medication entries with `daily_reminder=true`)
- [ ] Pet detail timeline view filterable by log_type

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/petHealthLog.ts`
- `server/src/services/pets/reminders.ts`
- `client/src/pets/PetHealthLog.tsx`
- `client/src/pets/PetHealthLogForm.tsx`
- `client/src/api/pets.ts` — extend
- `server/tests/services/pets/reminders.test.ts`

### Implementation steps

1. Routes: CRUD against `PetHealthLogRepository` (STORY-10.1).
2. Reminder hook:
```ts
export async function evaluateReminders(now: Date) {
  const upcoming = await petHealthRepo.upcomingCare(60);
  for (const e of upcoming) {
    const days = Math.ceil((e.next_due_date - now.getTime()) / 86_400_000);
    if (days === e.reminder_days_before || days === 1) {
      const pet = await petRepo.get(e.pet_id);
      await alertEngine.push({ source: 'pets', source_module: 'pets', alert_type: `pet_${e.log_type}_due`, severity: days <= 1 ? 'urgent' : 'warning',
        message: i18n.t(`alerts.pet.${e.log_type}`, { name: pet.name, days }), nav_mode_badge: 'pets', deep_link: `/pets/${pet.id}` });
    }
  }
  // Daily medication reminders
  const meds = await petHealthRepo.listActiveMedications();
  for (const m of meds) {
    await alertEngine.push({ source:'pets', alert_type:'pet_medication_today', severity:'info', message: i18n.t('alerts.pet.medication',{ name:(await petRepo.get(m.pet_id)).name, drug: JSON.parse(m.data_json).name }), nav_mode_badge:'pets' });
  }
}
```
3. UI:
   - Pet detail page tab "Health" → timeline grouped by log_type.
   - Add modal with log_type select; type-specific fields.
4. Tests:
   - 7 days before vaccination → alert fires
   - Active medication → daily alert
   - Dedup by day

### Key technical details

- Log types: `vaccination`, `flea_worming`, `medication`, `vet_visit`, `weight`, `document`, `symptom`.
- Active medication identified by `data_json.active === true`.
- All strings i18n.
- Reminder dedup per day.

---

## Dependencies

- **Blocked by:** STORY-10.1, STORY-14.3
- **Blocks:** STORY-3.4 (day card pet markers)

---

## Test Checklist

- [ ] Unit: vaccination 7d before → alert
- [ ] Unit: 1 day before → urgent alert
- [ ] Unit: dedup prevents second push same day
- [ ] Unit: active medication daily alert
- [ ] RTL: timeline renders entries grouped
- [ ] RTL: add modal type-specific fields

---

## Notes

- Pet weight logs feed STORY-10.5 chart (P2).
- Documents (PDFs) handled in STORY-10.6 (P2).
