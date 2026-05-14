# STORY-5.7: Shopping list module

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** L (3d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** household member
**I want** a shared shopping list with categories, ticking, and quick-add
**So that** anyone in the house can use it while shopping

---

## Acceptance Criteria

- [ ] Route `/food/shopping` renders all items grouped by category
- [ ] Categories from `app_settings.shopping_categories` (configurable; default Produce, Dairy, Meat, Bakery, Pantry, Frozen, Drinks, Other)
- [ ] Tap item → fades out and moves to "Ticked" section
- [ ] Add via input + autocomplete (common items + recent)
- [ ] "Clear ticked" button removes all ticked items
- [ ] Real-time sync via WebSocket — other devices see ticks immediately
- [ ] Pending-approval items shown to admin with approve/decline buttons
- [ ] Long lists virtualised with `react-virtuoso`/`react-window`

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/shoppingItems.ts` — full CRUD
- `server/src/services/ShoppingItemService.ts` — extend with ws emit
- `client/src/food/ShoppingList.tsx`
- `client/src/food/ShoppingItemRow.tsx`
- `client/src/food/QuickAddBar.tsx`
- `client/src/api/shopping.ts`
- `client/tests/food/ShoppingList.test.tsx`

### Implementation steps

1. Server endpoints:
   - `GET /api/v1/shopping-items` — list
   - `POST /api/v1/shopping-items` — create
   - `PATCH /api/v1/shopping-items/:id` — update (tick, approve)
   - `DELETE /api/v1/shopping-items/:id`
   - `POST /api/v1/shopping-items/clear-ticked` — bulk delete
   - On every write, `bus.emit('shopping:updated')` → WS broadcasts `{ type: 'shopping:updated' }`
2. Client groups by category; renders a section per category in fixed order, plus "Awaiting approval" (admin only) and "Ticked" sections.
3. `<ShoppingItemRow>`:
   - Checkbox + name + qty/unit + category dot.
   - Tap row toggles ticked (PATCH).
   - Long-press → edit modal.
4. Quick-add bar: text input with autocomplete from previously-added names; submit → POST.
5. Real-time: `useWebSocket` listener invalidates `['shopping']` on `shopping:updated` frame.
6. Virtualised list (Virtuoso) within each category if length > 50.
7. Tests: tick item moves to ticked section; admin sees pending; clear-ticked removes.

### Key technical details

- PRD §11 + WS sync per STORY-1.10.
- Optimistic ticking with rollback on failure.
- "Pending approval" flag from STORY-5.6 surfaces here for admin review.
- Categories order persisted to `app_settings.shopping_categories_order`.

---

## Dependencies

- **Blocked by:** STORY-5.1, STORY-1.10
- **Blocks:** STORY-5.6 (cross-creates items here)

---

## Test Checklist

- [ ] RTL: items render grouped by category
- [ ] RTL: tap item → moves to ticked
- [ ] RTL: add new item via quick-add
- [ ] RTL: clear-ticked removes all ticked
- [ ] RTL: WS frame triggers refetch
- [ ] RTL: admin sees pending approval row with approve/decline
- [ ] Manual: long list (100+) scrolls smoothly with virtualisation

---

## Notes

- A future "store layout" feature could reorder categories per-store — out of scope for MVP.
- Pending-approval is a minimal flow: admin clicks ✓ to approve (clears flag) or ✗ to delete.
