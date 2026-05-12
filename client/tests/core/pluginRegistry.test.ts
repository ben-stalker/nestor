import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerPlugin,
  unregisterPlugin,
  getWidgets,
  clearAllPlugins,
} from '../../src/core/pluginRegistry';

const MockWidget = () => null;
const OtherWidget = () => null;

beforeEach(() => {
  clearAllPlugins();
});

describe('pluginRegistry', () => {
  describe('registerPlugin', () => {
    it('adds a widget registration', () => {
      registerPlugin({
        pluginId: 'test-plugin',
        capability: 'home_screen_widget',
        component: MockWidget,
      });
      expect(getWidgets()).toHaveLength(1);
    });

    it('replaces duplicate pluginId+capability registration', () => {
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: MockWidget });
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: OtherWidget });
      const widgets = getWidgets();
      expect(widgets).toHaveLength(1);
      expect(widgets[0].component).toBe(OtherWidget);
    });

    it('allows multiple plugins with different ids', () => {
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: MockWidget });
      registerPlugin({ pluginId: 'p2', capability: 'home_screen_widget', component: OtherWidget });
      expect(getWidgets()).toHaveLength(2);
    });
  });

  describe('unregisterPlugin', () => {
    it('removes a registered plugin', () => {
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: MockWidget });
      unregisterPlugin('p1', 'home_screen_widget');
      expect(getWidgets()).toHaveLength(0);
    });

    it('does nothing for unknown plugin', () => {
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: MockWidget });
      unregisterPlugin('unknown');
      expect(getWidgets()).toHaveLength(1);
    });
  });

  describe('getWidgets', () => {
    it('returns only home_screen_widget registrations', () => {
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: MockWidget });
      expect(getWidgets()).toHaveLength(1);
      expect(getWidgets()[0].capability).toBe('home_screen_widget');
    });

    it('sorts by order field ascending', () => {
      registerPlugin({
        pluginId: 'p2',
        capability: 'home_screen_widget',
        component: OtherWidget,
        order: 2,
      });
      registerPlugin({
        pluginId: 'p1',
        capability: 'home_screen_widget',
        component: MockWidget,
        order: 1,
      });
      const widgets = getWidgets();
      expect(widgets[0].pluginId).toBe('p1');
      expect(widgets[1].pluginId).toBe('p2');
    });

    it('returns empty array when no plugins registered', () => {
      expect(getWidgets()).toHaveLength(0);
    });
  });

  describe('clearAllPlugins', () => {
    it('removes all registrations', () => {
      registerPlugin({ pluginId: 'p1', capability: 'home_screen_widget', component: MockWidget });
      clearAllPlugins();
      expect(getWidgets()).toHaveLength(0);
    });
  });
});
