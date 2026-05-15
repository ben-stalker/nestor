# Transport Adapters

Nestor's journey-time widget fetches live or estimated travel times for saved routes. The system is built around a `TransportAdapter` interface so community plugins can supply region-specific implementations (e.g. UK National Rail, Deutsche Bahn, Citymapper).

---

## Built-in adapter

The built-in `UkNoOpAdapter` (`providerId: "uk-no-op"`) is a **stub** that always returns 30 minutes and no disruptions. It is active until a plugin registers a real adapter. The admin UI flags stub adapters so users know data is mocked.

---

## Interface

```typescript
// server/src/services/TransportAdapter.ts

export type JourneyStatus = 'ok' | 'disrupted' | 'unknown';

export interface Disruption {
  id: string;
  severity: 'minor' | 'major' | 'severe';
  description: string;
}

export interface JourneyEta {
  journeyId: number;
  label: string;
  origin: string;
  destination: string;
  transportMode: string;
  etaMinutes: number | null;  // null = unable to determine
  status: JourneyStatus;
  disruptions: Disruption[];
  updatedAt: number;          // Unix ms
}

export interface TransportAdapter {
  readonly providerId: string;
  readonly isStub?: boolean;  // true → flagged in admin UI as mocked data
  getEta(journey: {
    id: number;
    label: string;
    origin: string;
    destination: string;
    transport_mode: string;   // 'transit' | 'drive' | 'walk' | 'cycle'
  }): Promise<JourneyEta>;
}
```

---

## Registering an adapter from a plugin

Import the registry and call `registerAdapter` during plugin initialisation:

```typescript
import { registerAdapter } from 'nestor/services/transport/adapterRegistry';

const myAdapter = {
  providerId: 'uk-nationalrail',
  isStub: false,
  async getEta(journey) {
    // Fetch from National Rail Darwin / OpenLDBWS
    const mins = await fetchDarwinJourneyTime(journey.origin, journey.destination);
    return {
      journeyId: journey.id,
      label: journey.label,
      origin: journey.origin,
      destination: journey.destination,
      transportMode: journey.transport_mode,
      etaMinutes: mins,
      status: 'ok',
      disruptions: [],
      updatedAt: Date.now(),
    };
  },
};

registerAdapter(myAdapter);
```

Call `unregisterAdapter(providerId)` in your plugin's teardown hook.

---

## Selecting an adapter per journey

Each journey row has an optional `provider_id` column. The journeys ETA endpoint passes this to `getActiveAdapter(journey.provider_id)`, which:

1. Returns the registered adapter with that `providerId` if found.
2. Falls back to the first registered plugin adapter.
3. Falls back to the built-in UK stub.

Set `provider_id` on a journey via `PATCH /api/v1/journeys/:id` to pin it to a specific adapter.

---

## Admin visibility

`GET /api/v1/admin/transport-adapter` returns the list of currently active adapters:

```json
[
  { "providerId": "uk-no-op", "isStub": true }
]
```

The admin settings screen renders a warning banner when all adapters are stubs.
