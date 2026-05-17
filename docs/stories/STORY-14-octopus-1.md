# STORY-14.1: Octopus Energy API credentials

**Epic:** EPIC-14: Octopus Energy Integration
**Estimate:** M (2d)
**Priority:** medium
**Status:** complete

---

## User Story

**As a** household admin
**I want** to enter my Octopus Energy API key and account number in settings
**So that** Nestor can fetch live electricity and gas consumption data from Octopus Energy

---

## Acceptance Criteria

- [x] Server: `octopus_api_key` (encrypted at rest via CryptoService) and `octopus_account_number` added to `SETTING_SCHEMAS` in `settings-keys.ts`
- [x] Server: `GET /api/v1/octopus/status` returns `{ configured: boolean, accountNumber: string|null, mpan: string|null, gasMprn: string|null, meterSerial: string|null, gasMeterSerial: string|null, tariffCode: string|null }`
- [x] Server: `POST /api/v1/octopus/credentials` (admin-pin gated) accepts `{ apiKey, accountNumber }`, validates by calling Octopus API `GET /v1/accounts/{accountNumber}` with Bearer auth, stores encrypted key + account number, returns `{ ok: true, mpan, meterSerial, gasMprn, gasMeterSerial, tariffCode }` from the first electricity + gas meter point found; returns 422 if Octopus API rejects
- [x] Server: `DELETE /api/v1/octopus/credentials` (admin-pin gated) clears credentials + stored meter identifiers
- [x] Server: MPAN, meter serial, gas MPRN, gas meter serial, tariff code all stored in app_settings for use by the sync job (STORY-14.2)
- [x] Client: New "Octopus Energy" tab/section added to the EV page (`EvPage.tsx`) rendered as `OctopusSettings` component
- [x] Client: `OctopusSettings` shows a form to enter API key + account number, a "Connect" button (admin-gated), and current connection status (connected / not connected)
- [x] Client: On successful save, display detected MPAN and tariff; on error display the Octopus API error message
- [x] Client: "Disconnect" button (admin-gated) calls DELETE and resets state
- [x] 10+ server tests, 5+ client tests; lint + typecheck + prettier clean

---

## Technical Implementation

### Octopus Energy API

- Base URL: `https://api.octopus.energy`
- Auth: HTTP Basic Auth with API key as username, empty password (`Authorization: Basic base64(apiKey:)`)
- Account endpoint: `GET /v1/accounts/{accountNumber}/`
- Response contains `properties[].electricity_meter_points[].mpan`, `.meters[].serial_number`, `.agreements[].tariff_code`
- Gas: `properties[].gas_meter_points[].mprn`, `.meters[].serial_number`

### Files to create / modify

**Server:**
- `server/src/db/settings-keys.ts` — add `octopus_api_key`, `octopus_account_number`, `octopus_mpan`, `octopus_meter_serial`, `octopus_gas_mprn`, `octopus_gas_meter_serial`, `octopus_tariff_code`
- `server/src/routes/octopus.ts` — new router factory
- `server/src/services/OctopusClient.ts` — HTTP client for Octopus Energy API
- `server/src/index.ts` — mount octopus router
- `server/tests/routes/octopus.test.ts`

**Client:**
- `client/src/ev/OctopusSettings.tsx`
- `client/src/ev/api.ts` — add octopus endpoints
- `client/src/ev/EvPage.tsx` — add Octopus Energy tab
- `client/tests/ev/OctopusSettings.test.tsx`

### Implementation steps

1. Add settings keys for Octopus credentials and meter identifiers to `settings-keys.ts`
2. Create `OctopusClient` service:
   - `validateAccount(apiKey, accountNumber)` — calls Octopus API, returns parsed meter info
   - Use node's built-in `fetch` (Node 22 has global fetch) with 10s timeout
   - Parse first electricity meter point MPAN + meter serial + tariff code
   - Parse first gas meter point MPRN + meter serial
3. Create `createOctopusRouter(settingsRepo, cryptoService, requireAdminPin)`:
   - `GET /api/v1/octopus/status`
   - `POST /api/v1/octopus/credentials`
   - `DELETE /api/v1/octopus/credentials`
4. Mount router in `index.ts`
5. Client `OctopusSettings` component with form + status display

### Key technical details

- API key must be encrypted at rest — use the existing `CryptoService` (encrypt before storing, decrypt before using)
- The Octopus API uses Basic Auth: `Authorization: Basic ${Buffer.from(apiKey + ':').toString('base64')}`
- Store meter identifiers in `app_settings` so the sync job (14.2) can read them without re-calling the account endpoint
- The `configure` status check should decrypt and verify the key is present without calling the external API

---

## Dependencies

- **Blocked by:** STORY-13.x (EV module complete)
- **Blocks:** STORY-14.2 (needs credentials + meter identifiers)

---

## Test Checklist

- [x] POST credentials with valid mock Octopus response → 200 with mpan/tariff
- [x] POST credentials with Octopus returning 401 → 422 with message
- [x] POST credentials with network error → 422 with message
- [x] GET status returns configured=true when key set
- [x] GET status returns configured=false when no key
- [x] DELETE credentials clears all settings
- [x] POST credentials requires admin pin
- [x] DELETE credentials requires admin pin
- [x] Client: shows form when not configured
- [x] Client: shows status when configured
