/**
 * Public voice API — proxies to the voice process or returns offline.
 * Mounted at /api/v1/voice.
 */
import { Router } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

const VOICE_BASE = `http://localhost:${process.env.NESTOR_VOICE_PORT ?? 3001}`;

async function getVoiceStatus(): Promise<{
  status: string;
  hasAudio: boolean;
  wakewordModel: string;
  sttModel: string;
  ttsModel: string;
} | null> {
  try {
    const res = await fetch(`${VOICE_BASE}/internal/voice/status`, {
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return null;
    return await (res.json() as Promise<{
      status: string;
      hasAudio: boolean;
      wakewordModel: string;
      sttModel: string;
      ttsModel: string;
    }>);
  } catch {
    return null;
  }
}

const TrainingStartSchema = z.object({
  wakePhrase: z.string().min(1).max(100).optional(),
});

export default function createVoiceRouter(): Router {
  const router = Router();

  // GET /api/v1/voice/status — returns voice process status or offline marker
  router.get('/status', async (_req, res, next) => {
    try {
      const vStatus = await getVoiceStatus();
      if (!vStatus) {
        res.json({ online: false, status: 'offline' });
        return;
      }
      res.json({ online: true, ...vStatus });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/voice/wakeword/start-training — admin only
  router.post('/wakeword/start-training', async (req, res, next) => {
    try {
      const parse = TrainingStartSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
        return;
      }

      const vStatus = await getVoiceStatus();
      if (!vStatus) {
        res.status(503).json({ error: 'Voice service offline', code: 'VOICE_OFFLINE' });
        return;
      }

      const token = process.env.NESTOR_VOICE_TOKEN ?? '';
      const proxyRes = await fetch(`${VOICE_BASE}/internal/voice/wakeword/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(parse.data),
        signal: AbortSignal.timeout(310_000),
      });

      if (!proxyRes.ok) {
        const err = await proxyRes.text();
        logger.warn({ status: proxyRes.status, err }, 'voice: training request failed');
        res.status(502).json({ error: 'Training failed', detail: err });
        return;
      }

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
