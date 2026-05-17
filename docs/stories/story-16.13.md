# STORY-16.13: YouTube player plugin

## Status: complete

## Tasks
- [x] `plugins/youtube-player/manifest.json`: capabilities `['nav_mode', 'home_screen_widget', 'settings_panel']`
- [x] Settings: `youtube_api_key` (password, optional), `search_enabled` (toggle), `allowed_channel_ids` (textarea), `allowed_profiles` (textarea), `curated_tiles` (textarea JSON)
- [x] Client `YouTubePlayerModal.tsx` — full-screen modal with `iframe` to `youtube-nocookie.com`, 64×64 close button
- [x] Server CSP header updated to allow `frame-src https://www.youtube-nocookie.com`
- [x] `POST /api/v1/plugins/youtube/search` proxy route (API key encrypted)
- [x] Profile permission gate using `allowed_profiles` setting
- [x] Escape key and close button dismiss modal

## Implementation Notes
`plugins/youtube-player/` — plugin manifest and stub entry.
`server/src/middleware/securityHeaders.ts` — CSP with `frame-src youtube-nocookie.com`.
`client/src/plugins/youtubePlayer/YouTubePlayerModal.tsx` — sandboxed iframe component.
