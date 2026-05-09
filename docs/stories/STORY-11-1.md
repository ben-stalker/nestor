# STORY-11.1: Board schema (messages, countdowns, whiteboard snapshots)

**Epic:** EPIC-11: Board Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** `board_messages`, `countdown_timers`, `whiteboard_snapshots` tables and repos
**So that** Board can persist

---

## Acceptance Criteria

- [ ] Migrations create all three tables per architecture data model
- [ ] Repositories with CRUD
- [ ] Tests

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_board.sql`
- `server/src/repositories/BoardMessageRepository.ts`
- `server/src/repositories/CountdownTimerRepository.ts`
- `server/src/repositories/WhiteboardSnapshotRepository.ts`
- `server/src/types/board.ts`
- `server/tests/repositories/board/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE board_messages (
  id INTEGER PRIMARY KEY,
  author_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE countdown_timers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  target_date INTEGER NOT NULL,
  show_on_home INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE whiteboard_snapshots (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  thumbnail_path TEXT,
  full_path TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```
2. Repos with `list`, `get`, `create`, `update`, `delete`.
3. Tests cover CRUD round-trip.

### Key technical details

- Architecture data model.
- Author cascades on profile delete (messages disappear with author).
- Whiteboard files stored on disk; rows hold paths only.
- Countdown timers with `show_on_home` feed STORY-3.9 "Coming Up" widget.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-11.2 (messages UI), STORY-11.3 (whiteboard), STORY-11.4 (countdowns)

---

## Test Checklist

- [ ] Unit: messages CRUD
- [ ] Unit: countdowns CRUD
- [ ] Unit: snapshots CRUD
- [ ] Unit: cascade delete profile → messages gone

---

## Notes

- Whiteboard PNG storage is part of the upload helper (reused from STORY-5.2 with `dir='whiteboard'`).
- A future "shared note" with multiple authors is Phase 2 (board messages are single-author for MVP).
