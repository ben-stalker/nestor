# CalDAV Transport Adapters

Nestor's calendar sync is built around a `CalendarProvider` interface so new CalDAV providers can be added without modifying core. The server ships with three providers and a local (offline) fallback.

## Interface

```typescript
// server/src/services/calendar/CalendarProvider.ts

export interface RawEvent {
  caldav_uid: string;
  caldav_etag?: string;
  title: string;
  start_datetime: number;   // Unix ms
  end_datetime: number;     // Unix ms
  all_day?: boolean;
  recurring_rule?: string;
  notes?: string;
}

export interface CalendarProvider {
  pull(account: CalendarAccount): Promise<RawEvent[]>;
  push(account: CalendarAccount, event: CalendarEvent): Promise<void>;
  testCredentials(account: CalendarAccount): Promise<boolean>;
}
```

| Method | Description |
|---|---|
| `pull(account)` | Fetches all events from the remote CalDAV account and returns them as `RawEvent[]`. |
| `push(account, event)` | Writes a new or updated event back to the remote CalDAV account. |
| `testCredentials(account)` | Tests whether the account credentials are valid. Returns `true` on success. |

## Built-in providers

| Provider | Module | Notes |
|---|---|---|
| Google Calendar | `GoogleCalDAVProvider.ts` | OAuth2 device-code flow; auto-refreshes access tokens. |
| Apple iCloud | `BasicAuthCalDAVProvider.ts` | Basic auth; use an app-specific password. |
| Yahoo Calendar | `BasicAuthCalDAVProvider.ts` | Basic auth against `caldav.calendar.yahoo.com`. |
| Local (offline) | `LocalProvider.ts` | Default fallback — stores events only in SQLite, no remote sync. |

## Registering a new provider

Import the registry and call `registerProvider` before the scheduler starts:

```typescript
import { registerProvider } from './services/calendar/providerRegistry';
import type { CalendarProvider } from './services/calendar/CalendarProvider';

const myProvider: CalendarProvider = {
  async pull(account) {
    // Fetch from your CalDAV endpoint
    return [];
  },
  async push(account, event) {
    // Write event to your CalDAV endpoint
  },
  async testCredentials(account) {
    // Return true if credentials are valid
    return true;
  },
};

registerProvider('my-provider', myProvider);
```

The first argument to `registerProvider` is the `provider_type` string stored on the `calendar_accounts` table. When a user adds a calendar account and selects your provider type, the scheduler calls `getProvider('my-provider')` to retrieve the correct implementation.

## Provider registry API

```typescript
import {
  registerProvider,
  getProvider,
  clearProviders,
} from './services/calendar/providerRegistry';
```

- `registerProvider(name, provider)` — registers a provider under `name`.
- `getProvider(name)` — returns the registered provider, or `LocalProvider` if `name` is not found.
- `clearProviders()` — removes all registered providers (used in tests).

## Journey-time adapters

For the journey-time / travel widget, see [docs/plugins/transport-adapters.md](plugins/transport-adapters.md) which documents the separate `TransportAdapter` interface.
