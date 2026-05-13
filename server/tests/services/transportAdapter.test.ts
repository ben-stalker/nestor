import { UkNoOpAdapter, defaultAdapter } from '../../src/services/TransportAdapter';

const JOURNEY = {
  id: 1,
  label: "Home → King's Cross",
  origin: 'Home',
  destination: "King's Cross",
  transport_mode: 'transit',
};

describe('UkNoOpAdapter', () => {
  let adapter: UkNoOpAdapter;

  beforeEach(() => {
    adapter = new UkNoOpAdapter();
  });

  it('has the correct providerId', () => {
    expect(adapter.providerId).toBe('uk-no-op');
  });

  it('resolves with a JourneyEta containing etaMinutes', async () => {
    const eta = await adapter.getEta(JOURNEY);
    expect(eta.etaMinutes).toBe(30);
  });

  it('echoes journey metadata into the ETA', async () => {
    const eta = await adapter.getEta(JOURNEY);
    expect(eta.journeyId).toBe(JOURNEY.id);
    expect(eta.label).toBe(JOURNEY.label);
    expect(eta.origin).toBe(JOURNEY.origin);
    expect(eta.destination).toBe(JOURNEY.destination);
    expect(eta.transportMode).toBe(JOURNEY.transport_mode);
  });

  it('sets updatedAt to a recent timestamp', async () => {
    const before = Date.now();
    const eta = await adapter.getEta(JOURNEY);
    expect(eta.updatedAt).toBeGreaterThanOrEqual(before);
    expect(eta.updatedAt).toBeLessThanOrEqual(Date.now());
  });

  it('resolves (does not reject) for any journey', async () => {
    const other = { id: 99, label: 'Walk', origin: 'A', destination: 'B', transport_mode: 'walk' };
    await expect(adapter.getEta(other)).resolves.toBeDefined();
  });
});

describe('defaultAdapter', () => {
  it('is an instance of UkNoOpAdapter', () => {
    expect(defaultAdapter).toBeInstanceOf(UkNoOpAdapter);
  });
});
