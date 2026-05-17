/* eslint-disable no-underscore-dangle, @typescript-eslint/require-await */
import path from 'node:path';

const teslaIndex = path.join(__dirname, '..', '..', '..', 'plugins', 'tesla', 'index.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
const tesla = require(teslaIndex) as {
  _internal: {
    extractState: (payload: unknown) => unknown;
    evaluateAlerts: (ctx: TestCtx, state: TeslaState | null) => void;
    fetchVehicleData: (ctx: TestCtx) => Promise<unknown>;
  };
};

interface TeslaState {
  battery_level: number | null;
  charging_state: string;
  plugged_in: boolean;
}

interface PushedAlert {
  message: string;
  alertKey?: string;
  severity?: string;
}

interface TestCtx {
  settings: Record<string, string>;
  alerts: PushedAlert[];
  spoken: string[];
  fetchedUrl?: string;
  fetchResponse?: { ok: boolean; status: number; body: string };
  pushAlert: (a: PushedAlert) => void;
  speak: (text: string) => void;
  getSetting: (k: string) => string | undefined;
  setSetting: (k: string, v: string) => void;
  httpRequest: (
    url: string,
  ) => Promise<{ ok: boolean; status: number; body: string; headers: Record<string, string> }>;
  registerWidget: (w: unknown) => void;
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
}

function makeCtx(overrides: Partial<TestCtx> = {}): TestCtx {
  const ctx: TestCtx = {
    settings: {},
    alerts: [],
    spoken: [],
    pushAlert: (a) => ctx.alerts.push(a),
    speak: (t) => ctx.spoken.push(t),
    getSetting: (k) => ctx.settings[k],
    setSetting: (k, v) => {
      ctx.settings[k] = v;
    },
    httpRequest: async (url) => {
      ctx.fetchedUrl = url;
      const r = ctx.fetchResponse ?? { ok: true, status: 200, body: '{}' };
      return { ...r, headers: {} };
    },
    registerWidget: () => undefined,
    logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
    ...overrides,
  };
  return ctx;
}

describe('tesla plugin', () => {
  it('extractState parses Tesla vehicle_data payload', () => {
    const state = tesla._internal.extractState({
      response: {
        charge_state: { battery_level: 42, battery_range: 100, charging_state: 'Charging' },
        drive_state: { timestamp: 1000 },
      },
    }) as TeslaState;
    expect(state.battery_level).toBe(42);
    expect(state.charging_state).toBe('Charging');
    expect(state.plugged_in).toBe(true);
  });

  it('extractState handles missing payload', () => {
    expect(tesla._internal.extractState(null)).toBeNull();
  });

  it('evaluateAlerts pushes low battery alert when below threshold and not plugged in', () => {
    const ctx = makeCtx();
    ctx.settings.low_battery_threshold = '20';
    ctx.settings.enable_alerts = 'true';
    tesla._internal.evaluateAlerts(ctx, {
      battery_level: 10,
      charging_state: 'Disconnected',
      plugged_in: false,
    });
    expect(ctx.alerts).toHaveLength(1);
    expect(ctx.alerts[0].message).toContain('10%');
  });

  it('evaluateAlerts does not alert when plugged in', () => {
    const ctx = makeCtx();
    ctx.settings.low_battery_threshold = '20';
    ctx.settings.enable_alerts = 'true';
    tesla._internal.evaluateAlerts(ctx, {
      battery_level: 10,
      charging_state: 'Charging',
      plugged_in: true,
    });
    expect(ctx.alerts).toHaveLength(0);
  });

  it('evaluateAlerts speaks once when fully charged', () => {
    const ctx = makeCtx();
    ctx.settings.enable_tts = 'true';
    tesla._internal.evaluateAlerts(ctx, {
      battery_level: 100,
      charging_state: 'Complete',
      plugged_in: true,
    });
    expect(ctx.spoken).toHaveLength(1);
    expect(ctx.spoken[0]).toMatch(/fully charged/i);
    // second call should not double-speak
    tesla._internal.evaluateAlerts(ctx, {
      battery_level: 100,
      charging_state: 'Complete',
      plugged_in: true,
    });
    expect(ctx.spoken).toHaveLength(1);
  });

  it('fetchVehicleData returns null without credentials', async () => {
    const ctx = makeCtx();
    const data = await tesla._internal.fetchVehicleData(ctx);
    expect(data).toBeNull();
  });

  it('fetchVehicleData calls Tesla Fleet API URL', async () => {
    const ctx = makeCtx({
      fetchResponse: { ok: true, status: 200, body: JSON.stringify({ response: {} }) },
    });
    ctx.settings.access_token = 't';
    ctx.settings.vehicle_id = '123';
    await tesla._internal.fetchVehicleData(ctx);
    expect(ctx.fetchedUrl).toContain('/api/1/vehicles/123/vehicle_data');
  });
});
