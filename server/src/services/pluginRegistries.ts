import { EventEmitter } from 'node:events';
import logger from '../utils/logger';

export interface WidgetDef {
  pluginId: string;
  id: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
  data?: unknown;
}

export interface NavModeDef {
  pluginId: string;
  id: string;
  label: string;
  icon?: string;
  accent?: string;
  route?: string;
}

export interface FilterDef {
  pluginId: string;
  id: string;
  label: string;
  group?: string;
}

export interface VoiceHandlerDef {
  pluginId: string;
  id: string;
  description?: string;
  handler: (transcript: string) => Promise<string | null> | string | null;
}

export interface CalendarSystemDef {
  pluginId: string;
  id: string;
  label: string;
  fetchEvents?: (rangeStart: Date, rangeEnd: Date) => Promise<unknown[]> | unknown[];
}

export type RegistryChange<T> = { type: 'add' | 'remove'; key: string; def?: T };

export class TypedRegistry<T extends { pluginId: string }> extends EventEmitter {
  private items = new Map<string, T>();

  register(key: string, def: T): void {
    if (this.items.has(key)) {
      logger.warn({ key, pluginId: def.pluginId }, 'Registry: overwriting existing entry');
    }
    this.items.set(key, def);
    this.emit('change', { type: 'add', key, def } satisfies RegistryChange<T>);
  }

  remove(key: string): boolean {
    const existed = this.items.delete(key);
    if (existed) {
      this.emit('change', { type: 'remove', key } satisfies RegistryChange<T>);
    }
    return existed;
  }

  removeByPlugin(pluginId: string): string[] {
    const removed: string[] = [];
    Array.from(this.items.entries()).forEach(([key, def]) => {
      if (def.pluginId === pluginId) {
        this.items.delete(key);
        removed.push(key);
        this.emit('change', { type: 'remove', key } satisfies RegistryChange<T>);
      }
    });
    return removed;
  }

  get(key: string): T | undefined {
    return this.items.get(key);
  }

  list(): T[] {
    return Array.from(this.items.values());
  }

  clear(): void {
    Array.from(this.items.keys()).forEach((key) => {
      this.items.delete(key);
      this.emit('change', { type: 'remove', key } satisfies RegistryChange<T>);
    });
  }

  size(): number {
    return this.items.size;
  }
}

export const widgetRegistry = new TypedRegistry<WidgetDef>();
export const navModeRegistry = new TypedRegistry<NavModeDef>();
export const sidebarFilterRegistry = new TypedRegistry<FilterDef>();
export const voiceHandlerRegistry = new TypedRegistry<VoiceHandlerDef>();
export const calendarSystemRegistry = new TypedRegistry<CalendarSystemDef>();

export function snapshotAllRegistries(): {
  widgets: WidgetDef[];
  navModes: NavModeDef[];
  sidebarFilters: FilterDef[];
  voiceHandlers: Omit<VoiceHandlerDef, 'handler'>[];
  calendarSystems: Omit<CalendarSystemDef, 'fetchEvents'>[];
} {
  return {
    widgets: widgetRegistry.list(),
    navModes: navModeRegistry.list(),
    sidebarFilters: sidebarFilterRegistry.list(),
    voiceHandlers: voiceHandlerRegistry.list().map(({ handler: _h, ...rest }) => rest),
    calendarSystems: calendarSystemRegistry.list().map(({ fetchEvents: _f, ...rest }) => rest),
  };
}
