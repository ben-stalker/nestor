# STORY-20.10: README + hardware guide + plugin developer docs

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** new user/contributor
**I want** clear docs for hardware, install, plugin development, and contribution
**So that** I can get started

---

## Acceptance Criteria

- [ ] Top-level `README.md` with hero, features, hardware guide, install command, screenshots
- [ ] `docs/install.md` — install script details + manual install
- [ ] `docs/hardware.md` — recommended kits (Pi 5, NUC), screens, mounts, audio cards
- [ ] `docs/plugin-dev.md` — manifest schema, capabilities, examples
- [ ] `docs/contributing.md` — workflow, code style, story format, i18n rules
- [ ] `docs/transport-adapters.md` — provider plugin contract
- [ ] Plugin manifest schema documented with examples
- [ ] Translations contribution guide

---

## Technical Implementation

### Files to create / modify

- `README.md`
- `docs/install.md`
- `docs/hardware.md`
- `docs/plugin-dev.md`
- `docs/contributing.md`
- `docs/transport-adapters.md`
- `docs/translations.md`
- `docs/plugins/manifest-example.json`

### Implementation steps

1. `README.md`:
   - One-line elevator pitch
   - 3–4 hero screenshots
   - Feature list (links to docs)
   - Install one-liner
   - "Get involved" section
2. `install.md`: prerequisites, supported distros, single-command install, manual install steps, troubleshooting.
3. `hardware.md`: tested combinations (Pi 5 8GB + 7" touchscreen, NUC i3 + 1080p kiosk display), audio, mounts, network.
4. `plugin-dev.md`: manifest schema reference, capabilities reference, "hello world" example, NestorPluginContext API, official plugin links.
5. `contributing.md`: branch flow, PR template, lint rules, i18n rule, story format.
6. `transport-adapters.md`: interface, registration, examples.
7. `translations.md`: how to add a new language pack.
8. Manifest example: working `manifest.json` with all fields populated.

### Key technical details

- Docs live in repo so versioned with releases.
- Screenshots in `docs/screenshots/` (PNG, optimised).
- Cross-link liberally between docs.

---

## Dependencies

- **Blocked by:** none (parallel with implementation)
- **Blocks:** STORY-20.11 (release blocks on docs complete)

---

## Test Checklist

- [ ] Manual: README renders well on GitHub
- [ ] Manual: install instructions reproducible
- [ ] Manual: plugin dev docs walk through a hello-world build
- [ ] Manual: hardware recommendations verified

---

## Notes

- Docs are part of the contract — update when changing behaviour.
- A future docusaurus-style site is Phase 2.
