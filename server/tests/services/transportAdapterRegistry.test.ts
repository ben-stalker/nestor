import {
  registerAdapter,
  unregisterAdapter,
  listAdapters,
  getActiveAdapter,
} from '../../src/services/transport/adapterRegistry';
import { defaultAdapter } from '../../src/services/TransportAdapter';
import type { TransportAdapter } from '../../src/services/TransportAdapter';

function makeAdapter(id: string, stub = false): TransportAdapter {
  return {
    providerId: id,
    isStub: stub,
    getEta: jest.fn().mockResolvedValue({
      journeyId: 1,
      label: 'Test',
      origin: 'A',
      destination: 'B',
      transportMode: 'transit',
      etaMinutes: 20,
      status: 'ok',
      disruptions: [],
      updatedAt: Date.now(),
    }),
  };
}

afterEach(() => {
  // Clean up any adapters registered during tests
  unregisterAdapter('test-adapter');
  unregisterAdapter('second-adapter');
});

describe('listAdapters', () => {
  it('returns the built-in default when no adapters registered', () => {
    const adapters = listAdapters();
    expect(adapters).toHaveLength(1);
    expect(adapters[0]).toBe(defaultAdapter);
  });

  it('returns registered adapters instead of the default', () => {
    const adapter = makeAdapter('test-adapter');
    registerAdapter(adapter);
    const adapters = listAdapters();
    expect(adapters.some((a) => a.providerId === 'test-adapter')).toBe(true);
  });
});

describe('registerAdapter / unregisterAdapter', () => {
  it('registers and retrieves an adapter', () => {
    const adapter = makeAdapter('test-adapter');
    registerAdapter(adapter);
    expect(getActiveAdapter('test-adapter')).toBe(adapter);
  });

  it('unregisters an adapter', () => {
    const adapter = makeAdapter('test-adapter');
    registerAdapter(adapter);
    unregisterAdapter('test-adapter');
    // After unregister, falls back to default (no more registered adapters)
    expect(getActiveAdapter('test-adapter')).toBe(defaultAdapter);
  });
});

describe('getActiveAdapter', () => {
  it('returns default adapter when registry is empty and no providerId given', () => {
    expect(getActiveAdapter()).toBe(defaultAdapter);
  });

  it('returns default adapter when providerId does not match and registry empty', () => {
    expect(getActiveAdapter('nonexistent')).toBe(defaultAdapter);
  });

  it('returns adapter by providerId', () => {
    const adapter = makeAdapter('test-adapter');
    registerAdapter(adapter);
    expect(getActiveAdapter('test-adapter')).toBe(adapter);
  });

  it('returns first registered adapter when providerId not given', () => {
    const adapter = makeAdapter('test-adapter');
    registerAdapter(adapter);
    expect(getActiveAdapter()).toBe(adapter);
  });
});

describe('UkNoOpAdapter', () => {
  it('default adapter has isStub = true', () => {
    expect(defaultAdapter.isStub).toBe(true);
  });

  it('default adapter returns status ok and empty disruptions', async () => {
    const eta = await defaultAdapter.getEta({
      id: 1,
      label: 'Route',
      origin: 'Home',
      destination: 'Work',
      transport_mode: 'transit',
    });
    expect(eta.status).toBe('ok');
    expect(eta.disruptions).toEqual([]);
  });
});
