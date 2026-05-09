# STORY-16.1: Plugin manifest schema + loader

**Epic:** EPIC-16: Plugin System & Official Plugins
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** plugins discovered from `/plugins/*/manifest.json` at startup
**So that** core can validate and register them

---

## Acceptance Criteria

- [ ] Zod schema for `manifest.json`: `{ id, name, version, author, description, capabilities[], settingsFields[], apiRisk: 'official'|'community'|'unofficial' }`
- [ ] On startup, scan `/plugins/`, validate each manifest, log warnings for invalid
- [ ] In-memory registry `PluginRegistry` with `register`, `list`, `get`, `setStatus`
- [ ] Disabled plugins flagged via `app_settings.plugins_enabled` JSON array
- [ ] `GET /api/v1/plugins` returns list with manifest + status

---

## Technical Implementation

### Files to create / modify

- `server/src/plugins/manifestSchema.ts`
- `server/src/plugins/PluginRegistry.ts`
- `server/src/plugins/loader.ts`
- `server/src/routes/plugins.ts` — basic listing route
- `server/tests/plugins/loader.test.ts`

### Implementation steps

1. Schema:
```ts
export const PluginManifest = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  author: z.string(),
  description: z.string(),
  capabilities: z.array(z.enum(['home_screen_widget','nav_mode','sidebar_filter','transport_adapter','calendar_source','voice_handler','tts_announcements','alert_source','settings_panel'])),
  settingsFields: z.array(z.object({ key: z.string(), label: z.string(), type: z.enum(['text','password','select','toggle','number']), options: z.array(z.string()).optional(), default: z.any().optional() })).default([]),
  apiRisk: z.enum(['official','community','unofficial']).default('community'),
});
```
2. Loader:
```ts
export async function loadAll() {
  const dirs = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
  for (const d of dirs.filter(x => x.isDirectory() && !x.name.startsWith('_'))) {
    try {
      const json = JSON.parse(await fs.readFile(path.join(PLUGINS_DIR, d.name, 'manifest.json'), 'utf8'));
      const parsed = PluginManifest.parse(json);
      registry.register({ ...parsed, status: enabled.includes(parsed.id) ? 'enabled' : 'disabled' });
    } catch (e) {
      log.warn({ err: e, plugin: d.name }, 'invalid plugin manifest');
    }
  }
}
```
3. Registry:
```ts
export const registry = new Map<string, PluginEntry>();
export function list(): PluginEntry[] { return [...registry.values()]; }
export function setStatus(id: string, status: 'enabled'|'disabled'|'error') { /* … */ }
```
4. Route: `router.get('/', requireProfile, (_req, res) => res.json(registry.list()));`
5. Tests: load valid plugin, load invalid (warning), enabled flag respected.

### Key technical details

- Architecture §"Component 2: Plugin Manager".
- For MVP: the loader only validates manifests; runtime invocation lands in STORY-16.2 (P2).
- `_test-chaos` directory ignored by `_` prefix convention.
- `apiRisk` displayed as a badge in admin (STORY-16.3 P2).

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-16.2 (runtime), STORY-16.3 (admin), STORY-16.4 (settings), STORY-16.5 (registries)

---

## Test Checklist

- [ ] Unit: valid plugin loaded
- [ ] Unit: invalid manifest logs warning
- [ ] Unit: GET /plugins returns list
- [ ] Unit: enabled flag respected
- [ ] Unit: `_*` directories skipped

---

## Notes

- For MVP scope, this is just a manifest loader; runtime `init(context)` invocation arrives in Phase 2 (STORY-16.2).
- Plugin developers can add a manifest now to begin authoring; activation comes later.
