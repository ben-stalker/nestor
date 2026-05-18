# Network Allow-list

Nestor is a local-first application (NFR-001). All outbound network calls must be intentional, documented, and user-initiated (or minimal poll traffic). This file is reviewed on every PR via the network-audit CI check.

## Allowed Hosts

| Host | Purpose | Story | Notes |
|------|---------|-------|-------|
| `api.open-meteo.com` | Weather data (no API key required) | STORY-3.1 | Polled every 30 min from home location |
| `api.github.com` | GitHub update polling (check for new releases) | STORY-19.8 | Polled nightly; can be disabled via settings |
| `raw.githubusercontent.com` | Download release tarball during update | STORY-19.8 | Only when update confirmed by admin |
| `oauth2.googleapis.com` | Google OAuth2 device-code token exchange | STORY-4.5 | User-initiated only; CalDAV pairing flow |
| `www.googleapis.com` | Google Calendar API (CalDAV via tsdav) | STORY-4.5 | Polled per sync interval set by user |
| `apidata.googleusercontent.com` | Google user profile data | STORY-4.5 | Used during OAuth flow |
| `caldav.icloud.com` | Apple iCloud CalDAV sync | STORY-4.6 | User-initiated; polled per sync interval |
| `caldav.calendar.yahoo.com` | Yahoo Calendar CalDAV sync | STORY-4.6 | User-initiated; polled per sync interval |
| `api.octopus.energy` | Octopus Energy EV tariff lookup | STORY-11.x | User-initiated; requires user-supplied API key |
| `www.youtube-nocookie.com` | CSP `frame-src` for embedded media | STORY-20.6 | Not fetched — appears in Content-Security-Policy header value only |
| `tailscale.com` | Documentation link in System panel | STORY-17.x | Anchor `href` — not fetched by server |
| `docs.syncthing.net` | Documentation link in System panel | STORY-17.x | Anchor `href` — not fetched by server |
| `i.pravatar.cc` | Placeholder avatar in UI component gallery | STORY-20.10 | Dev/gallery only; not reachable in production builds |

## Intentional Exemptions (not in allow-list)

| Route | Reason |
|-------|--------|
| `POST /api/v1/recipes/import-url` | User-supplied URL — any domain allowed. Rate-limited at route level. |
| CalDAV server URLs stored in `calendar_accounts.server_url` | User-supplied host from CalDAV account settings; not static. |
| Plugin-declared `networkHosts` in manifest | Each plugin declares its own hosts; reviewed during plugin certification. |

## Process for Adding a New Host

1. Identify the outbound call and the owning story.
2. Add the host to `ALLOWED_HOSTS` in `scripts/audit-network.ts`.
3. Add a row to this file with purpose, story, and notes.
4. Get the change reviewed in PR — the audit CI check will confirm it passes.

## CI Check

The network audit runs on every PR via `.github/workflows/network-audit.yml`. It performs a static scan of `server/src/**` and `client/src/**` for literal `https://` URLs, then fails if any host is not in the allow-list.

Dynamic URL construction (via `process.env` or settings values) is not statically caught — rely on code review for those cases.
