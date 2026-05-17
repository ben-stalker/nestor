# STORY-14.2: Octopus consumption sync job

**Epic:** EPIC-14: Octopus Energy Integration
**Estimate:** M (2d)
**Priority:** medium
**Status:** pending

---

## User Story

**As a** developer
**I want** a scheduled job that polls the Octopus Energy API for half-hourly consumption data
**So that** historical electricity and gas usage is stored locally for the dashboard

---

## Acceptance Criteria

- [ ] Migration `020_octopus_consumption.sql` creates `octopus_consumption` table: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `fuel_type TEXT NOT NULL CHECK(fuel_type IN ('electricity','gas'))`, `interval_start INTEGER NOT NULL` (Unix epoch seconds), `interval_end INTEGER NOT NULL`, `kwh REAL NOT NULL`, `created_at INTEGER NOT NULL DEFAULT (unixepoch())`
- [ ] Index: `CREATE UNIQUE INDEX idx_octopus_consumption_interval ON octopus_consumption(fuel_type, interval_start)`
- [ ] `OctopusConsumptionRepository` with: `upsert(row)`, `listForRange(fuelType, from, to)`, `latestIntervalStart(fuelType)`, `dailyTotals(fuelType, days)` 
- [ ] `OctopusClient.fetchConsumption(apiKey, mpan, meterSerial, fuelType, pageSize)` calls Octopus API consumption endpoint and returns parsed half-hourly intervals
- [ ] `OctopusClient.fetchTariff(tariffCode)` calls `/v1/products/{productCode}/electricity-tariffs/{tariffCode}/standard-unit-rates/` and `/standing-charges/` and returns current unit rate (p/kWh) and standing charge (p/day)
- [ ] Scheduler job registered as `octopus-sync` on `0 * * * *` (hourly)
- [ ] Sync job: skip if Octopus not configured; fetch electricity consumption from `latestIntervalStart` up to now; upsert rows; repeat for gas if MPRN configured; log counts
- [ ] `POST /api/v1/admin/run-octopus-sync` manual trigger (admin only) returns sync results JSON
- [ ] 15+ server tests; lint + typecheck + prettier clean

---

## Technical Implementation

### Octopus Consumption API

- Electricity: `GET /v1/electricity-meter-points/{mpan}/meters/{meterSerial}/consumption/?period_from={iso}&period_to={iso}&order_by=period&page_size=100`
- Gas: `GET /v1/gas-meter-points/{mprn}/meters/{meterSerial}/consumption/?period_from={iso}&period_to={iso}&order_by=period&page_size=100`
- Response: `{ results: [{ consumption, interval_start, interval_end }], next: string|null }`
- Pagination: follow `next` URL until null (store all half-hourly slots)
- Auth: Basic Auth (apiKey + ':')

### Tariff API

- Product code is extracted from tariff code: e.g. `E-1R-VAR-22-11-01-A` → product `VAR-22-11-01`
- `GET /v1/products/{productCode}/electricity-tariffs/{tariffCode}/standard-unit-rates/?period_from={today}`
- `GET /v1/products/{productCode}/electricity-tariffs/{tariffCode}/standing-charges/?period_from={today}`
- Returns current unit rate in p/kWh and standing charge in p/day

### Files to create / modify

**Server:**
- `server/migrations/020_octopus_consumption.sql`
- `server/src/repositories/OctopusConsumptionRepository.ts`
- `server/src/services/OctopusClient.ts` — extend with `fetchConsumption`, `fetchTariff`
- `server/src/services/OctopusSyncService.ts` — orchestrates sync
- `server/src/index.ts` — register scheduler job + admin endpoint
- `server/src/routes/admin.ts` — add `run-octopus-sync` endpoint
- `server/tests/repositories/OctopusConsumptionRepository.test.ts`
- `server/tests/services/OctopusSyncService.test.ts`

### Implementation steps

1. Author migration 020 with UNIQUE index to enable upsert-on-conflict
2. `OctopusConsumptionRepository`:
   - `upsert`: `INSERT OR REPLACE INTO octopus_consumption ...`
   - `listForRange`: ordered by `interval_start ASC`
   - `latestIntervalStart(fuelType)`: `SELECT MAX(interval_start) FROM octopus_consumption WHERE fuel_type=?`
   - `dailyTotals(fuelType, days)`: aggregate kWh per calendar day for last N days
3. Extend `OctopusClient` with `fetchConsumption` (paginated, follows next links) and `fetchTariff`
4. `OctopusSyncService.run()`:
   - Read API key (decrypt), MPAN, meter serial from app_settings
   - Skip if not configured
   - Determine sync window: from `latestIntervalStart` (or 30 days ago) to now
   - Fetch + upsert electricity consumption
   - If gas configured: fetch + upsert gas consumption
   - Return `{ electricityRows, gasRows }`
5. Register scheduler job in `index.ts`
6. Add admin endpoint

### Key technical details

- Use `INSERT OR REPLACE` for upsert (UNIQUE index on `fuel_type + interval_start`)
- Fetch in 48-slot pages (1 day of half-hourly data); follow `next` link for backfill
- For first sync: go back 30 days maximum
- API key decryption: use `CryptoService.decrypt()`
- Tariff product code extraction: `tariffCode.split('-').slice(2, -1).join('-')` for standard codes

---

## Dependencies

- **Blocked by:** STORY-14.1 (credentials + meter identifiers)
- **Blocks:** STORY-14.3 (dashboard reads from this table)

---

## Test Checklist

- [ ] Repository: upsert inserts new row
- [ ] Repository: upsert with same interval_start replaces existing
- [ ] Repository: listForRange returns correct window
- [ ] Repository: dailyTotals aggregates correctly
- [ ] Repository: latestIntervalStart returns null when empty
- [ ] Service: skips sync when not configured
- [ ] Service: fetches and upserts electricity consumption
- [ ] Service: fetches and upserts gas consumption when MPRN present
- [ ] Service: handles Octopus API errors gracefully
- [ ] Admin endpoint: returns 200 with sync results
- [ ] Admin endpoint: returns 403 for non-admin
