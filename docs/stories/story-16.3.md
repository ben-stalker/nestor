# STORY-16.3: Plugin admin page + enable/disable + settings panel

## Status: complete

## Tasks
- [x] `GET /api/v1/plugins` — list all plugins with manifest + status + errorMessage
- [x] `POST /api/v1/plugins/:id/enable` / `disable` — toggle plugin state (admin PIN required)
- [x] `POST /api/v1/plugins/:id/restart` — disable + re-load
- [x] `GET /api/v1/plugins/:id/settings` / `PUT /api/v1/plugins/:id/settings` — get/save plugin settings
- [x] `GET /api/v1/plugins/registries` — capability registry snapshot
- [x] Client `PluginsPage` at plugins nav entry — lists plugins with status badges
- [x] Enable/Disable toggle per plugin
- [x] "Configure" button opens `PluginSettingsModal` — renders settingsFields dynamically
- [x] Risk badges: "Official" (blue), "Community" (yellow), "Unofficial API" (orange)
- [x] "Browse Community" tab for community plugin directory

## Implementation Notes
`server/src/routes/plugins.ts`
`client/src/plugins/PluginsPage.tsx`
`client/src/plugins/components/PluginSettingsModal.tsx`
`client/src/plugins/api.ts`
`client/src/plugins/hooks/usePlugins.ts`
