import type React from 'react';

export type PluginCapability = 'home_screen_widget' | 'nav_mode' | 'settings_panel';

export interface PluginWidgetRegistration {
  pluginId: string;
  capability: 'home_screen_widget';
  component: React.ComponentType;
  order?: number;
}

type PluginRegistration = PluginWidgetRegistration;

const registrations: PluginRegistration[] = [];

export function registerPlugin(reg: PluginRegistration): void {
  const existing = registrations.findIndex(
    (r) => r.pluginId === reg.pluginId && r.capability === reg.capability,
  );
  if (existing >= 0) {
    registrations[existing] = reg;
  } else {
    registrations.push(reg);
  }
}

export function unregisterPlugin(pluginId: string, capability?: PluginCapability): void {
  const toRemove = capability
    ? registrations.findIndex((r) => r.pluginId === pluginId && r.capability === capability)
    : registrations.findIndex((r) => r.pluginId === pluginId);

  if (toRemove >= 0) registrations.splice(toRemove, 1);
}

export function getWidgets(): PluginWidgetRegistration[] {
  return registrations
    .filter((r): r is PluginWidgetRegistration => r.capability === 'home_screen_widget')
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function clearAllPlugins(): void {
  registrations.splice(0);
}
