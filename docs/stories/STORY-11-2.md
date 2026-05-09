# STORY-11.2: Family message board UI

**Epic:** EPIC-11: Board Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** sticky-note style messages colour-coded by author
**So that** quick household notes are visible

---

## Acceptance Criteria

- [ ] Route `/board` with messages displayed as sticky-note cards (colour from author profile)
- [ ] Compose: text area, optional pin toggle, save → POST
- [ ] Each message shows author avatar + content + relative timestamp ("3h ago")
- [ ] Dismiss / archive button (admin or author)
- [ ] Real-time push via WebSocket — other devices see new messages immediately
- [ ] Pinned messages float to top

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/board.ts`
- `server/src/services/BoardMessageService.ts`
- `client/src/board/BoardPage.tsx`
- `client/src/board/MessageCard.tsx`
- `client/src/board/ComposeBox.tsx`
- `client/src/api/board.ts`
- `server/tests/routes/board.test.ts`

### Implementation steps

1. Routes: standard CRUD against `BoardMessageRepository`. On every write, broadcast `{type: 'board:updated'}` via WS.
2. List: fetch unarchived messages; sort `pinned DESC, created_at DESC`.
3. `<MessageCard>`: rotated 1° randomly for sticky-note look (deterministic per id), author colour as background, content, relative time via `date-fns/formatDistanceToNow`.
4. Compose: textarea (max 500 chars), pin toggle, submit → POST.
5. Long-press → archive (own message or admin).
6. WS listener invalidates `['board']` query.
7. Tests: CRUD, ws emit on write, pinned float to top.

### Key technical details

- PRD §18.
- Sticky-note rotation uses `id % 5 - 2` degrees for stability.
- Author colour from profile palette.
- Reduced-motion disables rotation animation but keeps layout.

---

## Dependencies

- **Blocked by:** STORY-11.1, STORY-1.10
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: POST creates → 201
- [ ] Unit: GET sorted by pinned + created_at
- [ ] Unit: archive PATCH sets archived=1
- [ ] Unit: ws emit on write
- [ ] RTL: compose submits
- [ ] RTL: WS frame triggers refetch
- [ ] RTL: pinned message at top

---

## Notes

- Whiteboard freehand drawing is STORY-11.3 (P2).
- A future @-mention feature is Phase 2.
