# STORY-3.1: Open-Meteo weather service + cache

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a server-side weather service that fetches Open-Meteo and caches the result
**So that** the home screen and calendar can render weather without hammering the API

---

## Acceptance Criteria

- [ ] `WeatherService.getForLocation(lat, lon)` returns `{ current, hourly, daily }` for the next 7 days
- [ ] Result cached in memory; refreshed by scheduler every 30 minutes
- [ ] Coordinates from `app_settings.location` (`{lat, lon, label}` set during setup wizard)
- [ ] `GET /api/v1/weather` returns the cached object
- [ ] Graceful failure: stale cache served if refresh fails; alert pushed to engine if down > 6h (severity: warning)
- [ ] Unit tests with `nock` or fetch-mock covering happy path, transient failure, sustained failure
- [ ] No API key required (Open-Meteo is free)

---

## Technical Implementation

### Files to create / modify

- `server/src/services/WeatherService.ts`
- `server/src/routes/weather.ts`
- `server/src/scheduler/jobs/weatherRefresh.ts`
- `server/src/index.ts` — register job
- `server/tests/services/WeatherService.test.ts`

### Implementation steps

1. Service skeleton:
```ts
export class WeatherService {
  private cache: WeatherSnapshot | null = null;
  private lastSuccessAt = 0;

  async getForLocation(lat: number, lon: number): Promise<WeatherSnapshot> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,uv_index&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = await res.json();
    this.cache = transform(json);
    this.lastSuccessAt = Date.now();
    return this.cache;
  }

  getCached() { return this.cache; }
  ageMs() { return Date.now() - this.lastSuccessAt; }
}
```
2. `transform` reshapes Open-Meteo payload into our `WeatherSnapshot` (current, hourly[24], daily[7]).
3. Scheduler job (cron `*/30 * * * *`): reads `app_settings.location`, calls `getForLocation`, catches errors. If failure age > 6h, calls `AlertEngine.push({ source: 'weather', type: 'service_down', severity: 'warning' })`.
4. `GET /api/v1/weather`: returns `cache` (with `stale: ageMs > 30*60*1000` flag); 503 if cache empty.
5. Tests: mock fetch; assert cached value returned; assert stale flag after 31 mins; assert alert pushed after 6h sustained failure.

### Key technical details

- Architecture §"Third-Party Services" — Open-Meteo free tier, no key.
- Allow-list `https://api.open-meteo.com` for STORY-20.6 network audit.
- Cache lives in service singleton (no Redis); restart re-fetches on next cron tick.
- Coordinate units: WGS84 decimal degrees; weather code follows WMO standard.

---

## Dependencies

- **Blocked by:** STORY-1.5, STORY-1.11
- **Blocks:** STORY-3.5 (mini weather widget), STORY-3.3 (carousel mini-weather), home screen aggregation

---

## Test Checklist

- [ ] Unit: successful fetch caches value
- [ ] Unit: GET endpoint returns cached value
- [ ] Unit: GET returns 503 when cache empty
- [ ] Unit: refresh failure does not clear cache (stale served)
- [ ] Unit: 6h+ failure pushes alert via mock AlertEngine
- [ ] Manual: location update triggers next cron tick to refresh new coords
- [ ] Manual: allow-list audit passes (network audit STORY-20.6)

---

## Notes

- Wizard step (STORY-19.2) writes `app_settings.location` based on user-entered postcode → reverse geocode (deferred; for MVP allow lat/lon paste).
- Hourly resolution shown in mini-weather modal in STORY-3.5.
