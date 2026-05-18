# Nestor

Nestor is a self-hosted household dashboard for your home — touchscreen kiosk UI, family calendar, meal planner, voice commands, and more.

## Features

- **Calendar sync** — Google Calendar (OAuth2 CalDAV), Apple iCloud CalDAV, Yahoo CalDAV
- **Family profiles** — per-person profiles with optional PIN protection
- **Voice commands** — wake word detection via OpenWakeWord, speech-to-text via Whisper, text-to-speech via Piper (fully offline)
- **Meal planning** — weekly planner, recipe library with web import
- **Finance tracker** — bills, subscriptions, and spending commitments
- **Shopping lists** — household shopping and ad-hoc lists
- **Pets & vehicles** — pet profiles, EV charging status, journey time tracker
- **Board** — household messages and whiteboard
- **Bin schedules** — waste and recycling collection reminders
- **Contacts** — household contact list
- **EV & Octopus Energy** — Tesla plugin (battery, range, charging alerts), Octopus Energy tariff tracker
- **Plugin system** — extend Nestor with brand-specific integrations without touching core

## Hardware

Tested and documented for:

| Hardware                                                               | Notes                      |
| ---------------------------------------------------------------------- | -------------------------- |
| Intel NUC 7th-gen i3 + iiyama ProLite T2454MSC (24", portrait-mounted) | Primary reference platform |
| Raspberry Pi 5 8 GB + official 7" touchscreen                          | Lower-cost option          |

USB audio (e.g. Jabra Speak 410/510) required for voice features. See [docs/hardware.md](docs/hardware.md).

## Install

### Single-command install (Ubuntu 22+, requires root)

```bash
curl -fsSL https://raw.githubusercontent.com/benstalker/nestor/main/install/install.sh | sudo bash
```

After installation, open a browser at `http://localhost:3000` to run the Setup Wizard.

### Development

```bash
npm install
npm run dev
```

Requires Node 20 LTS (see `.nvmrc`). Use `nvm use` to switch automatically.

## Documentation

- [Installation guide](docs/install.md)
- [Hardware setup](docs/hardware.md)
- [Plugin development](docs/plugin-dev.md)
- [Transport adapters](docs/plugins/transport-adapters.md)
- [Translations](docs/translations.md)
- [Contributing](CONTRIBUTING.md)
- [Architecture](docs/architecture-nestor-2026-05-08.md)

## License

MIT — see [LICENSE](LICENSE).
