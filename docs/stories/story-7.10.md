# STORY-7.10: Children's routines (morning/bedtime)

**Status:** COMPLETE (2026-05-16)

## Tasks

- [x] `RoutinesPanel.tsx` — filters existing checklists by type `daily_reset` and name containing "morning", "bedtime", or "routine"
- [x] `RoutineChecklist` sub-component — shows checklist with progress counter (X/Y done), renders each item as a tick button using `updateChecklistItem` PATCH
- [x] Empty state with guidance to create a "Morning Routine" or "Bedtime Routine" checklist in House settings
- [x] Added "Routines" tab in ChildDetail for all child profiles
- [x] Uses existing `checklists` + `checklist_items` system (STORY-8.10)

## Notes
- Auto-reset provided by existing `checklist-reset` scheduler job (0 3 * * *)
- Step-by-step UI with visual tick indicator (○ / ✓)
