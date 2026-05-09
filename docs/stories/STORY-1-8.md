# STORY-1.8: AES-256-GCM encryption helper for credentials at rest

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** developer
**I want** a tested encryption helper that derives a key from `/etc/machine-id` + a salt in `app_settings`
**So that** plugin API keys and CalDAV credentials can be stored encrypted

---

## Acceptance Criteria

- [x] `server/src/utils/crypto.ts` exports `encrypt(plaintext: string): string` and `decrypt(ciphertext: string): string`
- [x] Key derivation: HKDF-SHA256 of (machine-id) + (`app_settings.encryption_salt`) → 32-byte key
- [x] Salt: 32 random bytes generated on first call if `encryption_salt` is missing; stored base64 in `app_settings`
- [x] Algorithm: AES-256-GCM with random 12-byte IV per encryption
- [x] Output format: `v1:<iv_b64>:<tag_b64>:<ciphertext_b64>` (single string)
- [x] Machine-id source: read `/etc/machine-id` on Linux; on macOS / when missing, fall back to `~/.nestor/machine-id` (generated UUID, persisted, mode 0600)
- [x] `decrypt` validates the version prefix (`v1:`) and throws on tampered ciphertext (GCM auth tag failure)
- [x] No plaintext credential ever logged
- [x] Unit tests cover: round-trip, IV uniqueness across N calls, tampered ciphertext rejection, missing machine-id fallback, `v1:` prefix

---

## Technical Implementation

### Files to create / modify

- `server/src/utils/crypto.ts`
- `server/tests/utils/crypto.test.ts`

### Implementation steps

1. Use Node's built-in `node:crypto` (no extra deps): `createCipheriv`, `createDecipheriv`, `randomBytes`, `hkdfSync`.
2. `getMachineId()`:
   - Try `fs.readFileSync('/etc/machine-id', 'utf8').trim()`.
   - On error, read `~/.nestor/machine-id`. If missing, generate `randomUUID()`, write with `mode: 0o600`, return it.
3. `getEncryptionKey()`:
   - Read `encryption_salt` from `AppSettingsRepository`.
   - If missing, generate `randomBytes(32)`, base64-encode, write via `appSettings.set('encryption_salt', salt)`.
   - Derive: `hkdfSync('sha256', machineId, saltBytes, Buffer.from('nestor-credentials'), 32)` → 32-byte key.
   - Memoise the key for the process lifetime.
4. `encrypt(plaintext)`:
   - `iv = randomBytes(12)`.
   - `cipher = createCipheriv('aes-256-gcm', key, iv)`.
   - `ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])`.
   - `tag = cipher.getAuthTag()`.
   - Return `'v1:' + iv.toString('base64') + ':' + tag.toString('base64') + ':' + ct.toString('base64')`.
5. `decrypt(blob)`:
   - Split on `:`; assert first segment is `'v1'`; throw `Error('Unsupported ciphertext version')` otherwise.
   - Decode iv, tag, ct from base64.
   - `decipher.setAuthTag(tag)`; `decipher.update(ct) + decipher.final()` → utf8 plaintext.
6. Tests use `:memory:` SQLite + `AppSettingsRepository`, then verify all ACs.

### Key technical details

- Architecture §"Data Encryption" specifies AES-256-GCM with machine-id-derived key.
- `hkdfSync` is available in Node 16+ (`crypto.hkdfSync(digest, ikm, salt, info, keylen)`).
- The `info` parameter (`'nestor-credentials'`) namespaces the derived key — future use cases (e.g. backup encryption) can derive different keys with different `info`.
- GCM mode produces a 16-byte authentication tag — non-negotiable for tamper detection.
- IV uniqueness is critical: GCM with reused IV completely breaks confidentiality. Use `randomBytes(12)` per call (96-bit IVs are the GCM standard).
- Architecture NFR-001: this enables NFR-001 (privacy: credentials never decryptable off-device because the machine-id is needed).

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-4.1 (CalDAV credentials), STORY-16.4 (plugin settings encryption)

---

## Test Checklist

- [x] Unit: `decrypt(encrypt('hello'))` returns `'hello'`
- [x] Unit: 100 encryptions of the same plaintext produce 100 distinct ciphertexts (IV uniqueness)
- [x] Unit: tamper with one base64 byte → `decrypt` throws (GCM tag failure)
- [x] Unit: missing `/etc/machine-id` → falls back to `~/.nestor/machine-id` (generated and persisted)
- [x] Unit: `decrypt('v0:…')` throws "Unsupported ciphertext version"
- [x] Unit: salt auto-generated on first call and re-used on subsequent calls
- [x] Unit: encrypted ciphertext starts with `v1:`
- [x] Manual: no `console.log` or `logger.info` calls in crypto.ts

---

## Notes

- For CI tests, set `NESTOR_DB_PATH` to a temp file so the salt is fresh per test.
- Backups (STORY-19.9) include `encryption_salt`; without it, encrypted blobs cannot be decrypted on a restored install.
- If a user moves their SQLite DB to a different physical machine, encrypted credentials become undecryptable — document this limitation in the README backup guide (STORY-20.10).
