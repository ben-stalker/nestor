'use strict';

const POLL_INTERVAL_MS = 60 * 60 * 1000;

const state = { timer: null };

async function pollOnce(ctx) {
  const apiKey = ctx.getSetting('api_key');
  if (!apiKey) {
    ctx.logger.info('garden-pal: no api key configured — skipping poll');
    return;
  }
  ctx.logger.info('garden-pal: poll skeleton — full implementation pending');
}

module.exports = {
  async init(ctx) {
    ctx.logger.info('Garden Pal plugin loaded — awaiting full implementation');
    ctx.registerSidebarFilter({ id: 'garden_pal', label: 'Garden Pal', group: 'plugins' });
    ctx.registerWidget({
      id: 'garden_pal_widget',
      title: 'Garden Pal',
      size: 'small',
      data: { status: 'stub' },
    });
    ctx.registerCalendarSystem({
      id: 'garden_pal',
      label: 'Garden Pal',
      fetchEvents: async () => [],
    });
  },
  async destroy() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  },
  _internal: { pollOnce, POLL_INTERVAL_MS },
};
