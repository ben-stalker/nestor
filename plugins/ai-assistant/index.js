'use strict';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

function buildContextPrompt(transcript, contextSummary) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return [
    `You are Nestor, a household assistant. Today is ${today}.`,
    contextSummary ? `Context: ${contextSummary}` : '',
    `User: ${transcript}`,
    'Reply in one or two short spoken sentences.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function callGemini(ctx, transcript) {
  const apiKey = ctx.getSetting('gemini_api_key');
  if (!apiKey) {
    return 'AI assistant is not configured. Please add a Gemini API key.';
  }
  const prompt = buildContextPrompt(transcript, '');
  try {
    const res = await ctx.httpRequest(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      timeoutMs: 15000,
    });
    if (!res.ok) {
      ctx.logger.warn(`gemini error status=${res.status}`);
      return null;
    }
    const data = JSON.parse(res.body);
    const text =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text;
    return typeof text === 'string' ? text.trim() : null;
  } catch (err) {
    ctx.logger.warn(`gemini failed: ${err && err.message ? err.message : err}`);
    return null;
  }
}

async function voiceHandler(ctx, transcript) {
  const reply = await callGemini(ctx, transcript);
  if (reply) ctx.speak(reply);
  return reply;
}

module.exports = {
  async init(ctx) {
    ctx.registerVoiceHandler({
      id: 'ai_assistant',
      description: 'Falls through unmatched voice commands to Gemini.',
      handler: (transcript) => voiceHandler(ctx, transcript),
    });
  },
  _internal: { buildContextPrompt, callGemini },
};
