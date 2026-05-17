/* eslint-disable no-underscore-dangle, @typescript-eslint/require-await */
import path from 'node:path';

const idx = path.join(__dirname, '..', '..', '..', 'plugins', 'ai-assistant', 'index.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
const ai = require(idx) as {
  _internal: {
    buildContextPrompt: (transcript: string, ctxSummary: string) => string;
    callGemini: (ctx: TestCtx, transcript: string) => Promise<string | null>;
  };
};

interface TestCtx {
  settings: Record<string, string>;
  fetchResponse?: { ok: boolean; status: number; body: string };
  getSetting: (k: string) => string | undefined;
  httpRequest: (
    url: string,
    opts?: unknown,
  ) => Promise<{ ok: boolean; status: number; body: string; headers: Record<string, string> }>;
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
}

function makeCtx(overrides: Partial<TestCtx> = {}): TestCtx {
  const ctx: TestCtx = {
    settings: {},
    getSetting: (k) => ctx.settings[k],
    httpRequest: async () => {
      const r = ctx.fetchResponse ?? { ok: true, status: 200, body: '{}' };
      return { ...r, headers: {} };
    },
    logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
    ...overrides,
  };
  return ctx;
}

describe('ai-assistant plugin', () => {
  it('buildContextPrompt includes user transcript', () => {
    const p = ai._internal.buildContextPrompt('what time is it', '');
    expect(p).toContain('User: what time is it');
    expect(p).toContain('Nestor');
  });

  it('callGemini returns a placeholder when no key configured', async () => {
    const ctx = makeCtx();
    const result = await ai._internal.callGemini(ctx, 'hi');
    expect(result).toMatch(/not configured/i);
  });

  it('callGemini extracts text from Gemini-shaped response', async () => {
    const ctx = makeCtx({
      fetchResponse: {
        ok: true,
        status: 200,
        body: JSON.stringify({
          candidates: [{ content: { parts: [{ text: '  Hello there. ' }] } }],
        }),
      },
    });
    ctx.settings.gemini_api_key = 'k';
    const result = await ai._internal.callGemini(ctx, 'hi');
    expect(result).toBe('Hello there.');
  });

  it('callGemini returns null on non-2xx', async () => {
    const ctx = makeCtx({
      fetchResponse: { ok: false, status: 500, body: 'oops' },
    });
    ctx.settings.gemini_api_key = 'k';
    const result = await ai._internal.callGemini(ctx, 'hi');
    expect(result).toBeNull();
  });
});
