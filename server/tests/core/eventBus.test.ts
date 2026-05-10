import logger from '../../src/utils/logger';
import eventBus from '../../src/core/eventBus';
import type { EventMap } from '../../src/core/eventBus.types';

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedLogger = logger as unknown as { error: jest.Mock };

beforeEach(() => {
  eventBus.removeAllListeners();
  jest.clearAllMocks();
});

describe('TypedEventBus — emit / on', () => {
  it('delivers the correct payload to a registered listener', () => {
    const received: EventMap['settings:updated'][] = [];
    eventBus.on('settings:updated', (p) => received.push(p));
    eventBus.emit('settings:updated', { keys: ['theme', 'language'] });
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ keys: ['theme', 'language'] });
  });

  it('delivers payload to multiple listeners in registration order', () => {
    const order: number[] = [];
    eventBus.on('settings:updated', () => order.push(1));
    eventBus.on('settings:updated', () => order.push(2));
    eventBus.emit('settings:updated', { keys: [] });
    expect(order).toEqual([1, 2]);
  });

  it('returns false when no listeners are registered', () => {
    expect(eventBus.emit('plugin:enabled', { pluginId: 'x' })).toBe(false);
  });

  it('returns true when at least one listener exists', () => {
    eventBus.on('plugin:enabled', () => {});
    expect(eventBus.emit('plugin:enabled', { pluginId: 'x' })).toBe(true);
  });
});

describe('TypedEventBus — listener isolation on throw', () => {
  it('continues running remaining listeners when one throws', () => {
    const called: number[] = [];
    eventBus.on('settings:updated', () => {
      throw new Error('boom');
    });
    eventBus.on('settings:updated', () => called.push(2));
    eventBus.emit('settings:updated', { keys: [] });
    expect(called).toEqual([2]);
  });

  it('logs the thrown error via pino', () => {
    const boom = new Error('listener-error');
    eventBus.on('settings:updated', () => {
      throw boom;
    });
    eventBus.emit('settings:updated', { keys: [] });
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: boom, event: 'settings:updated' }),
      'event listener threw',
    );
  });

  it('does not propagate the listener error to the emitter caller', () => {
    eventBus.on('settings:updated', () => {
      throw new Error('oops');
    });
    expect(() => eventBus.emit('settings:updated', { keys: [] })).not.toThrow();
  });
});

describe('TypedEventBus — once', () => {
  it('fires exactly once across multiple emits', () => {
    const calls: number[] = [];
    eventBus.once('plugin:disabled', () => calls.push(1));
    eventBus.emit('plugin:disabled', { pluginId: 'p' });
    eventBus.emit('plugin:disabled', { pluginId: 'p' });
    expect(calls).toHaveLength(1);
  });

  it('receives the correct payload on the single firing', () => {
    let received: EventMap['plugin:disabled'] | undefined;
    eventBus.once('plugin:disabled', (p) => {
      received = p;
    });
    eventBus.emit('plugin:disabled', { pluginId: 'my-plugin' });
    expect(received).toEqual({ pluginId: 'my-plugin' });
  });
});

describe('TypedEventBus — off', () => {
  it('stops delivering to a removed listener', () => {
    const calls: number[] = [];
    const handler = () => calls.push(1);
    eventBus.on('settings:updated', handler);
    eventBus.off('settings:updated', handler);
    eventBus.emit('settings:updated', { keys: [] });
    expect(calls).toHaveLength(0);
  });
});

describe('TypedEventBus — max listeners', () => {
  it('does not emit MaxListenersExceededWarning for 50 listeners', () => {
    const warnSpy = jest.spyOn(process, 'emitWarning').mockImplementation(() => {});
    for (let i = 0; i < 50; i += 1) {
      eventBus.on('settings:updated', () => {});
    }
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
