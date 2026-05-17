import {
  TypedRegistry,
  widgetRegistry,
  navModeRegistry,
  snapshotAllRegistries,
} from '../../src/services/pluginRegistries';

describe('TypedRegistry', () => {
  it('register and get works', () => {
    const r = new TypedRegistry<{ pluginId: string; id: string }>();
    r.register('a', { pluginId: 'p', id: 'a' });
    expect(r.get('a')).toEqual({ pluginId: 'p', id: 'a' });
    expect(r.size()).toBe(1);
  });

  it('emits change event on register and remove', () => {
    const r = new TypedRegistry<{ pluginId: string }>();
    const events: string[] = [];
    r.on('change', (ev: { type: string; key: string }) => {
      events.push(`${ev.type}:${ev.key}`);
    });
    r.register('a', { pluginId: 'p' });
    r.remove('a');
    expect(events).toEqual(['add:a', 'remove:a']);
  });

  it('removeByPlugin removes only matching entries', () => {
    const r = new TypedRegistry<{ pluginId: string }>();
    r.register('a', { pluginId: 'p1' });
    r.register('b', { pluginId: 'p1' });
    r.register('c', { pluginId: 'p2' });
    const removed = r.removeByPlugin('p1');
    expect(removed.sort()).toEqual(['a', 'b']);
    expect(r.size()).toBe(1);
    expect(r.get('c')).toBeDefined();
  });

  it('clear empties registry', () => {
    const r = new TypedRegistry<{ pluginId: string }>();
    r.register('a', { pluginId: 'p' });
    r.register('b', { pluginId: 'q' });
    r.clear();
    expect(r.size()).toBe(0);
  });

  it('list returns all entries', () => {
    const r = new TypedRegistry<{ pluginId: string; id: string }>();
    r.register('a', { pluginId: 'p', id: 'a' });
    r.register('b', { pluginId: 'p', id: 'b' });
    expect(r.list()).toHaveLength(2);
  });
});

describe('snapshotAllRegistries', () => {
  beforeEach(() => {
    widgetRegistry.clear();
    navModeRegistry.clear();
  });

  it('strips function fields from voice and calendar registries', () => {
    widgetRegistry.register('p:w', { pluginId: 'p', id: 'w', title: 'W' });
    navModeRegistry.register('p:n', { pluginId: 'p', id: 'n', label: 'N' });
    const snap = snapshotAllRegistries();
    expect(snap.widgets).toHaveLength(1);
    expect(snap.navModes).toHaveLength(1);
    expect(snap.voiceHandlers).toEqual([]);
    expect(snap.calendarSystems).toEqual([]);
  });
});
