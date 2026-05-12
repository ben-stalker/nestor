# STORY-3.8: Plugin widget strip on home

**Status:** complete

## Tasks

- [ ] client: pluginRegistry.ts — capability-based plugin registry stub
- [ ] client: features/home/PluginWidgetStrip.tsx — renders home_screen_widget plugins in sandboxed ErrorBoundary
- [ ] Update home/index.tsx to use PluginWidgetStrip
- [ ] Tests

## Notes

STORY-16.3 (full plugin manager) is a future dependency.
This story establishes the registry interface and the strip render logic.
Each plugin widget is sandboxed in an ErrorBoundary so a broken plugin
cannot take out the rest of the strip.
MVP: render in the order plugins were enabled (no drag-to-reorder yet).
Strip hides itself when no plugins are registered for home_screen_widget.
