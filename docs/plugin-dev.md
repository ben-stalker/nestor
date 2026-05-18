# Plugin Development

Nestor's plugin system lets you add brand-specific or niche integrations without modifying core. Plugins are Node.js modules loaded at startup from the `plugins/` directory.

## Plugin structure

Each plugin lives in its own subdirectory under `plugins/`:

```
plugins/
  my-plugin/
    manifest.json   # required — describes the plugin
    index.js        # required — entry point (value of "entry" in manifest)
    package.json    # optional — for plugins with npm dependencies
```

## Manifest schema

`manifest.json` declares everything the Plugin Manager needs to know before loading the plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "author": "Your Name",
  "description": "Short description shown in Admin → Plugins.",
  "capabilities": ["home_screen_widget"],
  "settingsFields": [
    { "key": "api_key", "label": "API key", "type": "password" },
    { "key": "refresh_interval", "label": "Refresh interval (minutes)", "type": "number", "default": 10 },
    { "key": "enable_alerts", "label": "Enable alerts", "type": "toggle", "default": true }
  ],
  "apiRisk": "community",
  "entry": "index.js"
}
```

### Field reference

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier. Must match the directory name. Lower-case, hyphens only. |
| `name` | string | Human-readable name shown in the UI. |
| `version` | string | Semver string. |
| `author` | string | Author name or organisation. |
| `description` | string | One-sentence description shown in Admin → Plugins. |
| `capabilities` | string[] | List of capabilities this plugin registers. See below. |
| `settingsFields` | object[] | Fields rendered in the plugin settings panel. See below. |
| `apiRisk` | string | `"official"` / `"community"` / `"unofficial"`. Shown as a badge in the UI. Use `"unofficial"` for reverse-engineered APIs. |
| `entry` | string | Entry file name relative to the plugin directory. |

### Capabilities

| Capability | Description |
|---|---|
| `home_screen_widget` | Plugin can register a widget displayed on the home screen via `ctx.registerWidget()`. |
| `alert_source` | Plugin can push alerts via `ctx.pushAlert()`. |
| `tts_announcements` | Plugin can speak text via `ctx.speak()`. |
| `settings_panel` | Plugin has a settings panel in Admin → Plugins. |
| `voice_handler` | Plugin receives unmatched voice transcripts (e.g. for AI fallback). |
| `nav_mode` | Plugin adds a full-screen mode accessible from the navigation bar. |
| `calendar_source` | Plugin provides calendar events (registers a `CalendarProvider`). |
| `sidebar_filter` | Plugin adds a filter entry to the calendar sidebar. |

### Settings field types

| Type | Description |
|---|---|
| `text` | Single-line text input. |
| `password` | Text input, value stored encrypted, masked in UI. |
| `number` | Numeric input. |
| `toggle` | Boolean toggle. |
| `textarea` | Multi-line text area. |

## Plugin context API (`NestorPluginContext`)

Your `init(ctx)` function receives a context object:

```js
module.exports = {
  async init(ctx) {
    // ctx methods available here
  },
  async destroy() {
    // clean up timers, connections, etc.
  },
};
```

### `ctx.getSetting(key)`

Returns the current value of a settings field as a string, or `undefined` if not set.

```js
const token = ctx.getSetting('api_key');
```

### `ctx.setSetting(key, value)`

Writes a value to the plugin's settings store. Useful for caching session state between polls.

```js
ctx.setSetting('last_seen_at', Date.now().toString());
```

### `ctx.logger`

Structured logger. Methods: `info`, `warn`, `error`.

```js
ctx.logger.info('plugin started');
ctx.logger.warn(`fetch failed: ${err.message}`);
```

### `ctx.registerWidget(widget)`

Registers (or updates) a home screen widget.

```js
ctx.registerWidget({
  id: 'my_widget',        // unique within the plugin
  title: 'My Widget',
  size: 'small',          // 'small' | 'medium' | 'large'
  data: { value: 42 },    // arbitrary data passed to the widget renderer
});
```

### `ctx.pushAlert(alert)`

Pushes an alert to the Nestor alert engine.

```js
ctx.pushAlert({
  severity: 'warning',           // 'info' | 'warning' | 'error'
  message: 'Battery is low',
  alertKey: 'my_plugin:battery_low',  // deduplication key
  deep_link: '/ev',              // optional — in-app path to open on tap
});
```

`alertKey` prevents the same alert from firing repeatedly. Alerts with the same key are deduplicated until dismissed.

### `ctx.speak(text)`

Queues a TTS announcement (requires `nestor-voice` service and `tts_announcements` capability).

```js
ctx.speak('Your car is fully charged');
```

### `ctx.httpRequest(url, options)`

Makes an outbound HTTP request. Respects the network allow-list defined in `docs/network-allowlist.md`.

```js
const res = await ctx.httpRequest('https://api.example.com/data', {
  headers: { Authorization: `Bearer ${token}` },
  timeoutMs: 15000,
});
if (res.ok) {
  const body = JSON.parse(res.body);
}
```

## Hello world plugin

```
plugins/
  hello-world/
    manifest.json
    index.js
```

**`manifest.json`**

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "version": "0.1.0",
  "author": "Your Name",
  "description": "A minimal example plugin.",
  "capabilities": ["home_screen_widget"],
  "settingsFields": [
    { "key": "greeting", "label": "Greeting text", "type": "text", "default": "Hello!" }
  ],
  "apiRisk": "official",
  "entry": "index.js"
}
```

**`index.js`**

```js
'use strict';

module.exports = {
  async init(ctx) {
    const greeting = ctx.getSetting('greeting') || 'Hello!';
    ctx.registerWidget({
      id: 'hello_widget',
      title: 'Hello World',
      size: 'small',
      data: { greeting },
    });
    ctx.logger.info('hello-world plugin started');
  },
  async destroy() {
    // nothing to clean up
  },
};
```

## Enabling a plugin

1. Place your plugin directory under `plugins/`.
2. Open **Admin → Plugins** in the Nestor UI.
3. Find your plugin in the list and toggle it on.
4. Fill in any required settings fields and press **Save**.
5. Restart the server for the plugin to load: `sudo systemctl restart nestor-server`.

Plugins with missing required settings are loaded in a degraded state — they log a warning but do not prevent the server from starting.

## Plugin API versions

The Plugin Manager exposes `ctx.apiVersion` (a semver string). The current version is `1.0.0`. Breaking changes to the plugin API will increment the major version and will be documented in the changelog.
