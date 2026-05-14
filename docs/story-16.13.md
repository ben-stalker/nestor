# STORY-16.13: YouTube player plugin

**Status:** backlog

## Overview

A plugin that renders a YouTube player inside Nestor without leaving kiosk mode. The player appears as a modal or a dedicated nav mode, lets household members search/browse and play videos, and returns them to the normal dashboard when dismissed — no address bar, no browser chrome, no escape from kiosk.

## Tasks

### Plugin scaffold
- [ ] Create `plugins/youtube-player/` directory with `manifest.json`
- [ ] Manifest declares capabilities: `nav_mode`, `home_screen_widget` (optional shortcut tile), `settings_panel`
- [ ] Plugin settings: `allowed_profiles` (array of profile IDs), `search_enabled` (bool), `allowed_channel_ids` (optional allow-list), `autoplay` (bool)

### Server
- [ ] No server-side YouTube API key required for basic embedded playback (uses `youtube-nocookie.com` embed URL)
- [ ] Optional: `POST /api/v1/plugins/youtube/search` proxies YouTube Data API v3 search if an API key is configured in plugin settings (encrypted via `CryptoService`)
- [ ] Plugin settings schema and validation in `plugins/youtube-player/server/settings.ts`

### Client — player UI
- [ ] `YouTubePlayerModal` — full-screen modal overlay rendered inside the React tree (stays within kiosk window)
- [ ] Embed via `<iframe src="https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&controls=1&modestbranding=1&rel=0" allow="autoplay; fullscreen" />`
- [ ] Large close/back button (touch-friendly, min 64 × 64 px) always visible in top-right corner
- [ ] Dismiss on back button, Escape key, or swipe-down gesture
- [ ] Prevents `iframe` from navigating the parent page (sandbox attribute: `allow-scripts allow-same-origin allow-presentation`)

### Client — browse / search
- [ ] `YouTubeBrowsePage` nav mode — shown as a tile in the nav when plugin is enabled
- [ ] If `search_enabled`: search bar posts to server proxy; shows result grid (thumbnail, title, channel)
- [ ] If `allowed_channel_ids` set: shows channel playlists instead of open search
- [ ] If neither: shows a curated shortcut grid (pre-configured video/playlist tiles set in plugin admin settings)
- [ ] Profile permission check — plugin respects `allowed_profiles` list; shows locked state for excluded profiles

### Admin settings panel
- [ ] `YouTubeSettingsPanel` component: toggle search on/off, paste YouTube Data API key, manage allowed-profile list, add/remove curated shortcut tiles (title + video/playlist URL)

### Kiosk safety
- [ ] `iframe` sandbox attribute prevents top-level navigation — the kiosk window never leaves `localhost:3000`
- [ ] No `allow-top-navigation` in sandbox
- [ ] Content Security Policy header updated on server: `frame-src https://www.youtube-nocookie.com` added

### Tests
- [ ] Server: plugin settings validation, search proxy (mocked HTTP), CSP header test
- [ ] Client: YouTubePlayerModal renders/closes, permission gate, search result grid

## Notes

Using `youtube-nocookie.com` avoids cookies and reduces Google tracking for children profiles. The `sandbox` attribute on the iframe is the key kiosk-safety mechanism — it must not include `allow-top-navigation` or `allow-popups-to-escape-sandbox`.

If the household wants parental controls, the `allowed_channel_ids` allow-list combined with `search_enabled: false` is the recommended approach rather than building a full content filter.

A future community contribution could swap the YouTube backend for a self-hosted PeerTube or Invidious instance by pointing `app_settings.youtube_embed_base_url` at an alternative host.
