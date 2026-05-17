'use strict';

function readBool(ctx, key, fallback) {
  const raw = ctx.getSetting(key);
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

function tryLoadEufyClient() {
  try {
    // eslint-disable-next-line global-require, import/no-unresolved
    return require('eufy-security-client');
  } catch (err) {
    return null;
  }
}

function onDoorbellRing(ctx) {
  if (!readBool(ctx, 'enable_doorbell_alerts', true)) return;
  ctx.pushAlert({
    severity: 'warning',
    message: 'Someone is at the front door',
    alertKey: `doorbell:${Math.floor(Date.now() / 30000)}`,
    deep_link: '/board',
  });
  ctx.speak('Someone at the front door');
}

function publishVacuumState(ctx, status) {
  if (!readBool(ctx, 'enable_vacuum_status', true)) return;
  ctx.registerWidget({
    id: 'eufy_vacuum',
    title: 'Robot Vacuum',
    size: 'small',
    data: { status: status || 'idle' },
  });
}

module.exports = {
  async init(ctx) {
    const lib = tryLoadEufyClient();
    if (!lib) {
      ctx.logger.warn('eufy-security-client not installed — running in stub mode');
      ctx.registerNavMode({ id: 'eufy', label: 'Eufy', icon: 'shield' });
      publishVacuumState(ctx, 'unknown');
      return;
    }
    const username = ctx.getSetting('username');
    const password = ctx.getSetting('password');
    if (!username || !password) {
      ctx.logger.info('eufy: credentials missing — running in stub mode');
      publishVacuumState(ctx, 'unknown');
      return;
    }
    ctx.registerNavMode({ id: 'eufy', label: 'Eufy', icon: 'shield' });
    publishVacuumState(ctx, 'idle');
    ctx.logger.info('eufy: initialized (live client integration not yet implemented)');
  },
  _internal: { onDoorbellRing, publishVacuumState, tryLoadEufyClient },
};
