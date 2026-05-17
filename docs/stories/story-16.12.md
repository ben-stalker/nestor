# STORY-16.12: Community plugin directory loader

## Status: complete

## Tasks
- [x] `GET /api/v1/plugins/community` — fetches and parses the community plugin index URL from `app_settings.community_plugin_index_url`
- [x] Returns `{ configured: boolean, plugins: CommunityPlugin[] }`
- [x] "Browse Community" tab in PluginsPage — lists community entries with name, description, author, risk badge
- [x] "Install" button triggers confirmation dialog: "Community plugin — review code before enabling"
- [x] `POST /api/v1/plugins/community/install` — logs intent, returns stub response
- [x] Warning dialog before install with risk acknowledgement

## Implementation Notes
`server/src/routes/plugins.ts` — `GET /api/v1/plugins/community` + `POST /api/v1/plugins/community/install`.
`client/src/plugins/PluginsPage.tsx` — Browse Community tab with confirm dialog.
