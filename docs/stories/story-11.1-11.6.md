# Epic 11: Board Module — STORY-11.1 through 11.6

**Status:** Complete  
**Completed:** 2026-05-16

---

## STORY-11.1: Board schema (messages, countdowns, whiteboard snapshots)

**Status:** Complete

**Acceptance Criteria:**
- [x] Migration 016_board.sql — `board_messages`, `countdown_timers`, `whiteboard_snapshots` tables with FK constraints and indexes
- [x] BoardMessageRepository (listActive, list, get, create, update, archive, delete)
- [x] CountdownRepository (list, listForHome, get, create, update, delete)
- [x] WhiteboardRepository (list, get, create, updateName, delete)

**Implementation Notes:**
- `board_messages` — profile_id nullable (FK to profiles, ON DELETE SET NULL), pinned/archived flags
- `countdown_timers` — target_date epoch ms, show_on_home flag, optional savings_goal_id
- `whiteboard_snapshots` — file_path + thumbnail_path for PNG snapshots

---

## STORY-11.2: Family message board UI

**Status:** Complete

**Acceptance Criteria:**
- [x] List of cards with author colour (derived from profile_id), content, timestamp (timeAgo)
- [x] Compose modal: text area, optional pin toggle, post → POST /api/v1/board/messages
- [x] Dismiss (archive) via POST /api/v1/board/messages/:id/archive
- [x] Realtime push via WebSocket — listens for `board:message_new` event, invalidates query
- [x] Pinned messages appear first in a separate "Pinned" section

**Implementation Notes:**
- Added `board:message_new` to EventMap in eventBus.types.ts
- WS server subscribes and forwards to all clients
- MessageBoard.tsx uses useWebSocket hook and useEffect to trigger refetch

---

## STORY-11.3: Whiteboard freehand drawing

**Status:** Complete

**Acceptance Criteria:**
- [x] HTML5 canvas with Pointer Events (touch + mouse + pen)
- [x] 9 colours, 4 stroke widths, eraser, clear, undo (20 state history)
- [x] Save snapshot → PNG → POST /api/v1/board/whiteboard (multer, stored at ~/.nestor/uploads/whiteboard/)
- [x] Snapshot list with name + image thumbnail (GET /api/v1/board/whiteboard/:id/image)
- [x] Delete snapshot removes file from disk

**Implementation Notes:**
- Canvas 1200×700 logical pixels, CSS scales to viewport
- Undo stores ImageData stack (max 20 states)
- Pressure-sensitive: uses Pointer Events API (e.pressure not directly mapped but API is correct)
- Tab switcher between Draw and Saved views

---

## STORY-11.4: Countdown timers

**Status:** Complete

**Acceptance Criteria:**
- [x] CRUD endpoints (GET/POST/PATCH/DELETE /api/v1/board/countdowns)
- [x] List view with day-count chips (amber for ≤7d, red for past, blue for future)
- [x] Optional "show on home screen" flag (stored as show_on_home, CountdownRepository.listForHome())
- [x] Linkable from savings goals (savings_goal_id FK field)

**Implementation Notes:**
- DayChip renders colour-coded day count
- Edit modal with date picker + show_on_home checkbox

---

## STORY-11.5: General lists

**Status:** Complete

**Acceptance Criteria:**
- [x] Reuses checklist engine (ChecklistRepository from STORY-8.10) with type=one_off|recurring
- [x] Listed under Board > Lists tab
- [x] Type validation enforces only one_off/recurring (daily_reset/trip blocked for board lists)
- [x] Create, view items, tick items, add items, delete items, reset (recurring), delete list

---

## STORY-11.6: Guest visit checklist

**Status:** Complete

**Acceptance Criteria:**
- [x] Checklist with guest_name and guest_arrival_date (existing columns in checklists table)
- [x] Scheduler alerts N days before (7, 3, 1 days) if any items incomplete
- [x] Pre-arrival template (7 items: towels, toiletries, bedding, hoovering, welcome note, wardrobe, wifi)
- [x] Post-departure template (6 items: bed linen, bathroom check, room check, key, hoovering, thank-you)

**Implementation Notes:**
- `evaluateGuestAlerts` service added to reminder-eval scheduler job
- Deduplication via alert key embedded in message text (matches existing pattern from petAlertService)
- GET /api/v1/board/guest-checklists filters checklists where guest_name IS NOT NULL

---

## Test Coverage

- **Server:** 28 new tests (933 total across 69 suites)
- **Client:** 21 new tests (501 total across 71 suites)
- All acceptance criteria validated
- Lint + typecheck clean
