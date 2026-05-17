'use strict';

module.exports = {
  init(ctx) {
    const always = ctx.getSetting('always_throw');
    const shouldThrow = always === 'true' || Math.random() < 0.5;
    if (shouldThrow) {
      throw new Error('Chaos plugin intentionally exploded on init');
    }
    ctx.registerWidget({
      id: 'chaos_widget',
      title: 'Chaos OK',
      size: 'small',
      data: { ok: true },
    });
    ctx.logger.info('chaos plugin survived init');
  },
};
