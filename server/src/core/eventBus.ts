import { EventEmitter } from 'node:events';
import logger from '../utils/logger';
import type { EventMap } from './eventBus.types';

/**
 * Typed in-process event bus. Use emit/on/off/once with declared EventMap keys.
 *
 * Listener isolation: if a listener throws, the error is logged via pino and remaining
 * listeners continue to run. Errors do NOT propagate back to the emitter caller.
 *
 * Usage:
 *   import eventBus from '../core/eventBus';
 *   eventBus.on('settings:updated', ({ keys }) => { reloadConfig(keys); });
 *   eventBus.emit('settings:updated', { keys: ['theme'] });
 */
export class TypedEventBus extends EventEmitter {
  /**
   * Dispatches an event, wrapping each listener in try/catch so one failing
   * listener cannot prevent others from running.
   */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean {
    const listeners = this.rawListeners(event as string);
    if (listeners.length === 0) return false;
    // rawListeners() returns once-wrappers as-is; calling them handles self-removal.
    listeners.forEach((fn) => {
      try {
        (fn as (p: EventMap[K]) => void)(payload);
      } catch (err) {
        logger.error({ err, event }, 'event listener threw');
      }
    });
    return true;
  }

  on<K extends keyof EventMap>(event: K, listener: (p: EventMap[K]) => void): this {
    return super.on(event as string, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: (p: EventMap[K]) => void): this {
    return super.off(event as string, listener);
  }

  once<K extends keyof EventMap>(event: K, listener: (p: EventMap[K]) => void): this {
    return super.once(event as string, listener);
  }
}

const eventBus = new TypedEventBus();
// Alert engine, WebSocket server, scheduler, and plugin manager will all subscribe.
eventBus.setMaxListeners(50);

export default eventBus;
