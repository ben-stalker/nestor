'use strict';

const TESLA_API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const POLL_INTERVAL_MS = 10 * 60 * 1000;

function readNumber(ctx, key, fallback) {
  const raw = ctx.getSetting(key);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readBool(ctx, key, fallback) {
  const raw = ctx.getSetting(key);
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

async function fetchVehicleData(ctx) {
  const token = ctx.getSetting('access_token');
  const vehicleId = ctx.getSetting('vehicle_id');
  if (!token || !vehicleId) return null;
  const url = `${TESLA_API_BASE}/api/1/vehicles/${vehicleId}/vehicle_data`;
  try {
    const res = await ctx.httpRequest(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 15000,
    });
    if (!res.ok) {
      ctx.logger.warn(`tesla: vehicle_data failed status=${res.status}`);
      return null;
    }
    return JSON.parse(res.body);
  } catch (err) {
    ctx.logger.warn(`tesla: vehicle_data error ${err && err.message ? err.message : err}`);
    return null;
  }
}

function extractState(payload) {
  if (!payload) return null;
  const body = payload.response || payload;
  const charge = body.charge_state || {};
  const drive = body.drive_state || {};
  return {
    battery_level: charge.battery_level ?? null,
    battery_range_mi: charge.battery_range ?? null,
    battery_range_km:
      typeof charge.battery_range === 'number' ? Math.round(charge.battery_range * 1.60934) : null,
    charging_state: charge.charging_state ?? 'Unknown',
    plugged_in: charge.charging_state && charge.charging_state !== 'Disconnected',
    last_seen: drive.timestamp ?? Date.now(),
  };
}

function registerWidget(ctx, state) {
  ctx.registerWidget({
    id: 'tesla_battery',
    title: 'Tesla',
    size: 'medium',
    data: state || { battery_level: null, charging_state: 'Unknown' },
  });
}

function evaluateAlerts(ctx, state) {
  if (!state) return;
  const threshold = readNumber(ctx, 'low_battery_threshold', 20);
  const alertsEnabled = readBool(ctx, 'enable_alerts', true);
  const ttsEnabled = readBool(ctx, 'enable_tts', true);

  if (
    alertsEnabled &&
    typeof state.battery_level === 'number' &&
    state.battery_level < threshold &&
    !state.plugged_in
  ) {
    ctx.pushAlert({
      severity: 'warning',
      message: `Your Tesla battery is at ${state.battery_level}%`,
      alertKey: `tesla_low_battery:${Math.floor(state.battery_level / 5) * 5}`,
      deep_link: '/ev',
    });
  }

  if (
    ttsEnabled &&
    state.charging_state === 'Complete' &&
    typeof state.battery_level === 'number' &&
    state.battery_level >= 99
  ) {
    const sessionKey = `tesla_charged:${new Date().toISOString().slice(0, 10)}`;
    const seen = ctx.getSetting(sessionKey);
    if (!seen) {
      ctx.setSetting(sessionKey, '1');
      ctx.speak('Your car is fully charged');
    }
  }
}

async function poll(ctx) {
  const payload = await fetchVehicleData(ctx);
  const state = extractState(payload);
  registerWidget(ctx, state);
  evaluateAlerts(ctx, state);
}

const state = { timer: null };

module.exports = {
  async init(ctx) {
    registerWidget(ctx, null);
    await poll(ctx);
    state.timer = setInterval(() => {
      poll(ctx).catch((err) => ctx.logger.warn(`tesla poll failed: ${err && err.message}`));
    }, POLL_INTERVAL_MS);
    if (state.timer && typeof state.timer.unref === 'function') state.timer.unref();
  },
  async destroy() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  },
  // exported for tests
  _internal: { fetchVehicleData, extractState, evaluateAlerts, poll },
};
