# STORY-14.7: Plugin-source alerts

**Epic:** EPIC-14: Alert System
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** plugin author
**I want** to push alerts via `pluginContext.pushAlert(...)`
**So that** plugin alerts surface in the same strip

---

## Acceptance Criteria

- [ ] `NestorPluginContext.pushAlert(input)` proxies to `AlertEngine.push` with `source='plugin:<id>'`
- [ ] Disabling a plugin auto-dismisses its outstanding alerts
- [ ] Alert dismissal does not re-fire while plugin is enabled (dedup)
- [ ] Alerts sourced by `plugin:<id>` carry the plugin name in display
- [ ] Tests cover proxy + auto-dismiss

---

## Technical Implementation

### Files to create / modify

- `server/src/plugins/PluginContext.ts` — extend with `pushAlert`
- `server/src/services/AlertEngine.ts` — extend with `dismissBySource(source)`
- `server/src/plugins/PluginManager.ts` — invoke `dismissBySource` on disable
- `server/tests/plugins/contextAlert.test.ts`

### Implementation steps

1. `PluginContext.pushAlert(input)` wraps engine call:
```ts
pushAlert: (input) => alertEngine.push({ ...input, source: `plugin:${plugin.id}`, source_module: input.source_module ?? 'plugin' }),
```
2. `AlertEngine.dismissBySource(source)`:
```ts
async dismissBySource(source: string) {
  const ids = await alertRepo.findActive({ source });
  for (const a of ids) await this.dismiss(a.id);
}
```
3. `PluginManager.disable(id)` calls `alertEngine.dismissBySource(`plugin:${id}`)` after deregistering capabilities.
4. UI: alert card shows plugin name when source matches `plugin:*` (look up from registry).
5. Tests: pushAlert creates alert with correct source; disable plugin clears its alerts.

### Key technical details

- The plugin manager ensures plugin alerts are scoped — never bleed.
- Alert dedup logic from STORY-14.1 still applies inside engine.
- Plugin context is the only API plugin code uses to push alerts (no direct AlertEngine access).

---

## Dependencies

- **Blocked by:** STORY-14.2, STORY-16.4 (plugin context plumbing landed); for MVP without 16.2 runtime, this story stubs the context interface and unit-tests the engine method.
- **Blocks:** Phase 2 plugin alert UX

---

## Test Checklist

- [ ] Unit: pushAlert sets source=plugin:<id>
- [ ] Unit: dismissBySource removes plugin alerts
- [ ] Unit: disabling plugin auto-dismisses
- [ ] Unit: dedup prevents same-day re-fire
- [ ] Unit: UI badge shows plugin name

---

## Notes

- Full plugin-runtime context lands in STORY-16.2 (Phase 2); this story formalises the contract.
- The `nav_mode_badge` defaults to the plugin's nav_mode if registered; otherwise falls back to a "plugins" badge.
