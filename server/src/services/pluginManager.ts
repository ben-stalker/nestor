import path from 'node:path';
import type AlertRepository from '../repositories/AlertRepository';
import type { AlertSeverity } from '../repositories/AlertRepository';
import type PluginSettingsRepository from '../repositories/PluginSettingsRepository';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import logger from '../utils/logger';
import { pluginRegistry, listPlugins, markStatus, getPlugin } from './pluginLoader';
import {
  widgetRegistry,
  navModeRegistry,
  sidebarFilterRegistry,
  voiceHandlerRegistry,
  calendarSystemRegistry,
  type WidgetDef,
  type NavModeDef,
  type FilterDef,
  type VoiceHandlerDef,
  type CalendarSystemDef,
} from './pluginRegistries';

export interface PluginPushAlertParams {
  type?: string;
  severity?: AlertSeverity;
  message: string;
  deep_link?: string;
  alertKey?: string;
  nav_mode_badge?: string;
}

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export interface HttpResponse {
  status: number;
  ok: boolean;
  body: string;
  headers: Record<string, string>;
}

export interface NestorPluginContext {
  pluginId: string;
  pushAlert: (params: PluginPushAlertParams) => void;
  speak: (text: string) => void;
  addEvent: (event: { title: string; startISO: string; endISO?: string }) => void;
  registerWidget: (widget: Omit<WidgetDef, 'pluginId'>) => void;
  registerNavMode: (mode: Omit<NavModeDef, 'pluginId'>) => void;
  registerSidebarFilter: (filter: Omit<FilterDef, 'pluginId'>) => void;
  registerVoiceHandler: (handler: Omit<VoiceHandlerDef, 'pluginId'>) => void;
  registerCalendarSystem: (system: Omit<CalendarSystemDef, 'pluginId'>) => void;
  getSetting: (key: string) => string | undefined;
  setSetting: (key: string, value: string) => void;
  httpRequest: (url: string, options?: HttpRequestOptions) => Promise<HttpResponse>;
  logger: {
    info: (msg: string, data?: unknown) => void;
    warn: (msg: string, data?: unknown) => void;
    error: (msg: string, data?: unknown) => void;
  };
}

interface PluginModule {
  init?: (ctx: NestorPluginContext) => void | Promise<void>;
  destroy?: (ctx: NestorPluginContext) => void | Promise<void>;
}

export interface PluginManagerDeps {
  alertRepo: AlertRepository;
  settingsRepo: AppSettingsRepository;
  pluginSettingsRepo: PluginSettingsRepository;
  speakFn?: (text: string) => void;
  addEventFn?: (event: { title: string; startISO: string; endISO?: string }) => void;
  fetchFn?: typeof fetch;
}

const ALERT_PLUGIN_SOURCE_PREFIX = 'plugin:';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

interface RateLimitState {
  windowStart: number;
  count: number;
}

export class PluginManager {
  private readonly deps: PluginManagerDeps;

  private readonly modules = new Map<string, PluginModule>();

  private readonly contexts = new Map<string, NestorPluginContext>();

  private readonly alertKeyCache = new Map<string, Set<string>>();

  private readonly rateLimits = new Map<string, RateLimitState>();

  constructor(deps: PluginManagerDeps) {
    this.deps = deps;
  }

  private handlePluginError(pluginId: string, message: string): void {
    markStatus(pluginId, 'error', message);
    this.deregisterCapabilities(pluginId);
    this.dismissPluginAlerts(pluginId);
  }

  private deregisterCapabilities(pluginId: string): void {
    widgetRegistry.removeByPlugin(pluginId);
    navModeRegistry.removeByPlugin(pluginId);
    sidebarFilterRegistry.removeByPlugin(pluginId);
    voiceHandlerRegistry.removeByPlugin(pluginId);
    calendarSystemRegistry.removeByPlugin(pluginId);
    this.alertKeyCache.delete(pluginId);
  }

  private dismissPluginAlerts(pluginId: string): void {
    const source = `${ALERT_PLUGIN_SOURCE_PREFIX}${pluginId}`;
    const active = this.deps.alertRepo.listActive();
    active.forEach((alert) => {
      if (alert.type === source || (alert.message && alert.message.startsWith(`[${source}]`))) {
        this.deps.alertRepo.dismiss(alert.id);
      }
    });
  }

  private buildContext(pluginId: string): NestorPluginContext {
    const { alertRepo, pluginSettingsRepo, speakFn, addEventFn, fetchFn } = this.deps;
    const usedAlertKeys = new Set<string>();
    this.alertKeyCache.set(pluginId, usedAlertKeys);

    const fetchImpl = fetchFn ?? globalThis.fetch.bind(globalThis);

    const checkRateLimit = (): boolean => {
      const now = Date.now();
      const state = this.rateLimits.get(pluginId);
      if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
        this.rateLimits.set(pluginId, { windowStart: now, count: 1 });
        return true;
      }
      if (state.count >= RATE_LIMIT_MAX) return false;
      state.count += 1;
      return true;
    };

    const log = {
      info: (msg: string, data?: unknown): void => logger.info({ pluginId, data }, msg),
      warn: (msg: string, data?: unknown): void => logger.warn({ pluginId, data }, msg),
      error: (msg: string, data?: unknown): void => logger.error({ pluginId, data }, msg),
    };

    const context: NestorPluginContext = {
      pluginId,
      pushAlert: (params): void => {
        const type = `${ALERT_PLUGIN_SOURCE_PREFIX}${pluginId}`;
        const key = params.alertKey ?? params.message;
        if (usedAlertKeys.has(key)) {
          const existing = alertRepo
            .listActive()
            .find((a) => a.type === type && a.message.includes(`[${key}]`));
          if (existing) return;
        }
        usedAlertKeys.add(key);
        try {
          alertRepo.create({
            type,
            severity: params.severity ?? 'info',
            message: `[${key}] ${params.message}`,
            deep_link: params.deep_link,
            nav_mode_badge: params.nav_mode_badge,
          });
        } catch (err) {
          log.error('pushAlert failed', err);
        }
      },
      speak: (text: string): void => {
        if (speakFn) {
          try {
            speakFn(text);
          } catch (err) {
            log.error('speak failed', err);
          }
        } else {
          log.info(`tts: ${text}`);
        }
      },
      addEvent: (event): void => {
        if (addEventFn) {
          try {
            addEventFn(event);
          } catch (err) {
            log.error('addEvent failed', err);
          }
        } else {
          log.info(`addEvent: ${event.title}`);
        }
      },
      registerWidget: (widget): void => {
        widgetRegistry.register(`${pluginId}:${widget.id}`, { ...widget, pluginId });
      },
      registerNavMode: (mode): void => {
        navModeRegistry.register(`${pluginId}:${mode.id}`, { ...mode, pluginId });
      },
      registerSidebarFilter: (filter): void => {
        sidebarFilterRegistry.register(`${pluginId}:${filter.id}`, { ...filter, pluginId });
      },
      registerVoiceHandler: (handler): void => {
        voiceHandlerRegistry.register(`${pluginId}:${handler.id}`, { ...handler, pluginId });
      },
      registerCalendarSystem: (system): void => {
        calendarSystemRegistry.register(`${pluginId}:${system.id}`, { ...system, pluginId });
      },
      getSetting: (key): string | undefined => pluginSettingsRepo.get(pluginId, key),
      setSetting: (key, value): void => pluginSettingsRepo.set(pluginId, key, value),
      httpRequest: async (url, options = {}): Promise<HttpResponse> => {
        if (!checkRateLimit()) {
          throw new Error(`plugin ${pluginId}: rate limit exceeded (${RATE_LIMIT_MAX}/min)`);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
        try {
          const res = await fetchImpl(url, {
            method: options.method ?? 'GET',
            headers: options.headers,
            body: options.body,
            signal: controller.signal,
          });
          const body = await res.text();
          const headers: Record<string, string> = {};
          res.headers.forEach((v, k) => {
            headers[k] = v;
          });
          return { status: res.status, ok: res.ok, body, headers };
        } finally {
          clearTimeout(timeout);
        }
      },
      logger: log,
    };
    return context;
  }

  loadPlugin(id: string): PluginModule | null {
    const entry = pluginRegistry.get(id);
    if (!entry) {
      logger.warn({ id }, 'pluginManager: loadPlugin called on unknown plugin');
      return null;
    }
    const entryFile = path.join(entry.dir, entry.manifest.entry);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-dynamic-require, global-require
      delete require.cache[require.resolve(entryFile)];
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
      const mod = require(entryFile) as PluginModule;
      this.modules.set(id, mod);
      return mod;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, id }, 'pluginManager: failed to require plugin entry');
      this.handlePluginError(id, message);
      return null;
    }
  }

  async enablePlugin(id: string): Promise<boolean> {
    const entry = pluginRegistry.get(id);
    if (!entry) return false;

    if (entry.status === 'enabled') return true;

    const mod = this.loadPlugin(id);
    if (!mod) return false;

    const ctx = this.buildContext(id);
    this.contexts.set(id, ctx);

    if (typeof mod.init === 'function') {
      try {
        await mod.init(ctx);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.handlePluginError(id, message);
        return false;
      }
    }

    entry.status = 'enabled';
    entry.errorMessage = undefined;
    this.persistEnabled();
    return true;
  }

  async disablePlugin(id: string): Promise<boolean> {
    const entry = pluginRegistry.get(id);
    if (!entry) return false;

    const mod = this.modules.get(id);
    const ctx = this.contexts.get(id);
    if (mod?.destroy && ctx) {
      try {
        await Promise.resolve(mod.destroy(ctx));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ err, id }, 'pluginManager: destroy threw');
        this.handlePluginError(id, message);
      }
    }

    this.deregisterCapabilities(id);
    this.dismissPluginAlerts(id);
    this.contexts.delete(id);
    this.modules.delete(id);

    entry.status = 'disabled';
    entry.errorMessage = undefined;
    this.persistEnabled();
    return true;
  }

  async restartPlugin(id: string): Promise<boolean> {
    await this.disablePlugin(id);
    return this.enablePlugin(id);
  }

  private persistEnabled(): void {
    const enabledIds = listPlugins()
      .filter((p) => p.status === 'enabled')
      .map((p) => p.manifest.id);
    try {
      this.deps.settingsRepo.set('plugins_enabled', enabledIds);
    } catch (err) {
      logger.warn({ err }, 'pluginManager: failed to persist plugins_enabled');
    }
  }

  async startEnabledFromSettings(): Promise<void> {
    const enabledIds = this.deps.settingsRepo.get<string[]>('plugins_enabled') ?? [];
    // eslint-disable-next-line no-restricted-syntax
    for (const id of enabledIds) {
      // eslint-disable-next-line no-await-in-loop
      await this.enablePlugin(id);
    }
  }

  getContext(id: string): NestorPluginContext | undefined {
    return this.contexts.get(id);
  }
}

let activeManager: PluginManager | null = null;

export function setActivePluginManager(mgr: PluginManager | null): void {
  activeManager = mgr;
}

export function getActivePluginManager(): PluginManager | null {
  return activeManager;
}

export { getPlugin, listPlugins };
