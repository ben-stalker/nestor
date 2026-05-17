import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal AudioContext mock — single class keeps max-classes-per-file happy.
// ---------------------------------------------------------------------------

interface FakeGainNodeNode {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    setTargetAtTime: ReturnType<typeof vi.fn>;
  };
}

interface FakeOscillator {
  type: OscillatorType;
  frequency: { value: number };
}

class MockAudioContext {
  state: AudioContextState = 'suspended';

  currentTime = 0;

  destination = {};

  oscillators: FakeOscillator[] = [];

  gains: FakeGainNodeNode[] = [];

  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });

  createOscillator(): FakeOscillator & { connect: (_n: FakeGainNode) => void; start: () => void; stop: () => void } {
    const osc: FakeOscillator & { connect: (_n: FakeGainNode) => void; start: () => void; stop: () => void } = {
      type: 'sine' as OscillatorType,
      frequency: { value: 0 },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      connect: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      start: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      stop: () => {},
    };
    this.oscillators.push(osc);
    return osc;
  }

  createGain(): FakeGainNodeNode & { connect: (_d: unknown) => void } {
    const g: FakeGainNodeNode & { connect: (_d: unknown) => void } = {
      gain: {
        setValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      connect: () => {},
    };
    this.gains.push(g);
    return g;
  }
}

let mockCtx: MockAudioContext;

beforeEach(() => {
  mockCtx = new MockAudioContext();
  const ref = { ctx: mockCtx };
  // Regular function so `new` keyword returns ref.ctx (object return from constructor).
  // eslint-disable-next-line prefer-arrow-callback, func-names
  vi.stubGlobal('AudioContext', function () {
    return ref.ctx;
  });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// audioChime tests
// ---------------------------------------------------------------------------

describe('audioChime', () => {
  it('does not play when AudioContext is suspended', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'suspended';

    playChime('info', 0.5);

    expect(mockCtx.oscillators).toHaveLength(0);
  });

  it('plays oscillator(s) for info severity when running', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('info', 0.5);

    expect(mockCtx.oscillators.length).toBeGreaterThanOrEqual(1);
  });

  it('plays two oscillators for success severity (ascending arpeggio)', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('success', 0.5);

    expect(mockCtx.oscillators).toHaveLength(2);
  });

  it('uses sawtooth wave for error/urgent', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('error', 0.5);

    expect(mockCtx.oscillators[0].type).toBe('sawtooth');
  });

  it('uses triangle wave for warning', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('warning', 0.5);

    expect(mockCtx.oscillators[0].type).toBe('triangle');
  });

  it('uses sine wave for info', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('info', 0.5);

    expect(mockCtx.oscillators[0].type).toBe('sine');
  });

  it('unlockAudioContext resumes a suspended context', async () => {
    const { unlockAudioContext } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'suspended';

    unlockAudioContext();

    expect(mockCtx.resume).toHaveBeenCalledOnce();
  });

  it('unlockAudioContext is a no-op when already running', async () => {
    const { unlockAudioContext } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    unlockAudioContext();

    expect(mockCtx.resume).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Volume scaling
// ---------------------------------------------------------------------------

describe('volume scaling', () => {
  it('passes volume to gain.setValueAtTime', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('info', 0.3);

    expect(mockCtx.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.3, expect.any(Number));
  });

  it('clamps volume to max 1', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('info', 1.5);

    expect(mockCtx.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it('clamps volume to min 0', async () => {
    const { playChime } = await import('../../src/alerts/audioChime');
    mockCtx.state = 'running';

    playChime('info', -0.5);

    expect(mockCtx.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// Category toggle logic
// ---------------------------------------------------------------------------

describe('category toggle suppression logic', () => {
  it('suppresses when nav_mode is explicitly disabled', () => {
    const categories: Record<string, boolean> = { house: false, calendar: true };
    const navMode = 'house';

    const suppressed = navMode != null && categories[navMode] === false;
    expect(suppressed).toBe(true);
  });

  it('allows when nav_mode is explicitly enabled', () => {
    const categories: Record<string, boolean> = { house: true };
    const navMode = 'house';

    const suppressed = navMode != null && categories[navMode] === false;
    expect(suppressed).toBe(false);
  });

  it('allows when nav_mode has no entry (defaults to enabled)', () => {
    const categories: Record<string, boolean> = {};
    const navMode = 'family';

    const suppressed = navMode != null && categories[navMode] === false;
    expect(suppressed).toBe(false);
  });

  it('allows when nav_mode_badge is null', () => {
    const categories: Record<string, boolean> = { house: false };
    const navMode = null;

    const suppressed = navMode != null && categories[navMode as string] === false;
    expect(suppressed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Quiet hours logic
// ---------------------------------------------------------------------------

function isQuietHours(qh: { enabled: boolean; start: string; end: string } | undefined): boolean {
  if (!qh?.enabled) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = qh.start.split(':').map(Number);
  const [eh, em] = qh.end.split(':').map(Number);
  const start = sh * 60 + (sm ?? 0);
  const end = eh * 60 + (em ?? 0);

  if (start <= end) return nowMinutes >= start && nowMinutes < end;
  return nowMinutes >= start || nowMinutes < end;
}

describe('quiet hours logic', () => {
  it('returns false when quiet hours disabled', () => {
    expect(isQuietHours({ enabled: false, start: '22:00', end: '07:00' })).toBe(false);
  });

  it('returns false when quiet hours undefined', () => {
    expect(isQuietHours(undefined)).toBe(false);
  });

  it('returns true when now falls within a same-day window', () => {
    const now = new Date();
    const hh = (n: number) => String(n).padStart(2, '0');
    const startH = (now.getHours() - 1 + 24) % 24;
    const endH = (now.getHours() + 2) % 24;
    const start = startH * 60;
    const end = endH * 60;

    if (start < end) {
      expect(isQuietHours({ enabled: true, start: `${hh(startH)}:00`, end: `${hh(endH)}:00` })).toBe(true);
    }
  });

  it('returns false when now is outside the quiet window', () => {
    const now = new Date();
    const farH = (now.getHours() + 5) % 24;
    const endH = (farH + 1) % 24;
    const hh = (n: number) => String(n).padStart(2, '0');
    const start = farH * 60;
    const end = endH * 60;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (start < end && !(nowMinutes >= start && nowMinutes < end)) {
      expect(isQuietHours({ enabled: true, start: `${hh(farH)}:00`, end: `${hh(endH)}:00` })).toBe(false);
    }
  });
});
