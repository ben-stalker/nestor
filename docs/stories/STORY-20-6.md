# STORY-20.6: Network audit (no undisclosed outbound calls)

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** maintainer
**I want** a CI check that the codebase has no surprise outbound network calls
**So that** the local-first promise is enforced

---

## Acceptance Criteria

- [ ] Static scan of `axios`/`fetch`/`http` usages; allow-listed hosts (Open-Meteo, GitHub, CalDAV providers)
- [ ] Plugin-declared hosts respected via plugin manifest
- [ ] Documented allow-list reviewed during code review (`docs/network-allowlist.md`)
- [ ] CI fails on new domain not in list

---

## Technical Implementation

### Files to create / modify

- `scripts/audit-network.ts` — static scanner
- `docs/network-allowlist.md`
- `.github/workflows/network-audit.yml` — runs on PR

### Implementation steps

1. Scanner:
```ts
import { Project } from 'ts-morph';
const p = new Project();
p.addSourceFilesAtPaths('server/src/**/*.ts');
p.addSourceFilesAtPaths('client/src/**/*.ts');
p.addSourceFilesAtPaths('plugins/**/*.ts');
const calls = [];
for (const f of p.getSourceFiles()) {
  for (const c of f.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    // detect fetch(url) / axios(url) / new URL(url) etc.
    // extract literal URL or template root
  }
}
const ALLOWED = ['api.open-meteo.com','api.github.com','oauth2.googleapis.com','www.googleapis.com','apidata.googleusercontent.com','caldav.icloud.com','caldav.calendar.yahoo.com','raw.githubusercontent.com'];
const violations = calls.filter(c => !ALLOWED.some(a => c.url.includes(a)));
if (violations.length) { console.error(violations); process.exit(1); }
```
2. Recipe import endpoint (STORY-5.3) is special — user-supplied URLs; documented as exempt by route name.
3. Plugins declare additional allow-listed hosts in their manifest (`networkHosts: []`); audit reads those too.
4. CI runs `node --loader ts-node/esm scripts/audit-network.ts`.
5. Doc lists all allowed hosts with rationale.

### Key technical details

- Architecture NFR-001 (local-first).
- Static scanning is best-effort — runtime requests via env-var URLs slip through; the allow-list lives in code review.
- A future runtime guard via DNS/proxy could enforce stronger; out of scope for MVP.

---

## Dependencies

- **Blocked by:** STORY-1.2
- **Blocks:** —

---

## Test Checklist

- [ ] CI: audit runs on PR
- [ ] CI: introducing a fetch to a new domain fails
- [ ] Manual: doc lists all hosts with rationale

---

## Notes

- `ts-morph` is the cleanest static-analysis lib; alternatives include grep — `ts-morph` understands AST.
- Recipe import is intentionally not allow-listed (user-supplied URL); rate-limited at the route level.
