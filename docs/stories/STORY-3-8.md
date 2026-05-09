# STORY-3.8: Plugin widget strip on home

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** plugin author
**I want** my plugin to register a home-screen widget that renders alongside core widgets
**So that** the home screen extends without core changes

---

## Acceptance Criteria

- [ ] `<PluginWidgetStrip>` queries `pluginRegistry` (server) for components with capability `home_screen_widget` (or via client-side plugin registry hook)
- [ ] Renders each in a sandboxed `<ErrorBoundary>` — a broken widget doesn't take out the strip
- [ ] Hidden if no active plugins register widgets
- [ ] Drag-to-reorder (Phase 2) optional — for MVP, render in order plugins were enabled
- [ ] Each widget given a fixed grid cell with consistent padding

---

## Technical Implementation

### Files to create / modify

- `client/src/home/PluginWidgetStrip.tsx`
- `client/src/plugins/widgetRegistry.ts` — observable client-side registry
- `client/src/plugins/usePluginWidgets.ts`
- `client/src/shared/ui/ErrorBoundary.tsx` — ensure suitable for plugin isolation
- `client/tests/home/PluginWidgetStrip.test.tsx`

### Implementation steps

1. Client registry:
```ts
const widgets: Map<string, { id: string; pluginId: string; component: React.FC }> = new Map();
const subs = new Set<() => void>();
export function registerWidget(w) { widgets.set(w.id, w); subs.forEach(s => s()); }
export function unregisterWidget(id) { widgets.delete(id); subs.forEach(s => s()); }
export function usePluginWidgets() {
  const [v, set] = useState(0);
  useEffect(() => { const fn = () => set(x => x+1); subs.add(fn); return () => subs.delete(fn); }, []);
  return [...widgets.values()];
}
```
2. `<PluginWidgetStrip>`:
```tsx
const widgets = usePluginWidgets();
if (widgets.length === 0) return null;
return <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">{widgets.map(w => (
  <ErrorBoundary key={w.id} fallback={<WidgetErrorCard pluginId={w.pluginId} />}>
    <w.component />
  </ErrorBoundary>
))}</div>;
```
3. `WidgetErrorCard`: shows "Plugin {name} crashed" with disable link to admin.
4. For MVP without plugin runtime (16.2), the strip renders empty (no plugins register widgets); the contract is in place.
5. Tests: widget registers → visible; widget throws → error card replaces it; empty → strip hidden.

### Key technical details

- Architecture §"Plugin Isolation" NFR-004.
- Each widget gets a stable grid slot — drag-to-reorder Phase 2.
- ErrorBoundary catches render errors; logs to server `/client-errors`.
- Disabling a plugin auto-unregisters its widget via PluginManager.

---

## Dependencies

- **Blocked by:** STORY-3.2, STORY-16.3 (admin enable/disable; for MVP the registry contract is fine)
- **Blocks:** STORY-16.7 (Tesla widget registers here in Phase 2)

---

## Test Checklist

- [ ] RTL: register widget → renders
- [ ] RTL: widget throws → error card shown, strip continues
- [ ] RTL: empty registry → strip hidden
- [ ] RTL: unregister removes widget
- [ ] Unit: WidgetErrorCard links to admin

---

## Notes

- Plugin runtime that loads widget components from plugin code lands in STORY-16.2 (Phase 2). For MVP the registry exists, ready to be populated.
- A future API allows admin to reorder widgets (Phase 2).
