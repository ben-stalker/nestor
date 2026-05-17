/**
 * Internal IPC routes — called by the voice process, not by the client.
 * Mounted at /internal/voice (no /api/v1 prefix).
 * Protected by shared secret in app_settings.voice_internal_token.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import VoiceCommandRepository from '../repositories/VoiceCommandRepository';
import { getDb } from '../db/connection';
import voiceRouter from '../voice/VoiceRouter';
import eventBus from '../core/eventBus';
import logger from '../utils/logger';

const CommandSchema = z.object({
  transcript: z.string().min(1),
  durationMs: z.number().int().nonnegative().optional(),
});

const StatusSchema = z.object({
  status: z.enum(['idle', 'listening', 'processing', 'speaking']),
});

export default function createInternalVoiceRouter(
  settingsRepo: AppSettingsRepository = new AppSettingsRepository(getDb()),
  voiceCmdRepo: VoiceCommandRepository = new VoiceCommandRepository(getDb()),
): Router {
  const router = Router();

  function requireVoiceToken(req: Request, res: Response, next: NextFunction): void {
    const token = settingsRepo.get('voice_internal_token') as string | null;
    if (token) {
      const provided = req.headers.authorization ?? '';
      if (provided !== `Bearer ${token}`) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
    }
    next();
  }

  // POST /internal/voice/command — voice process posts transcript here after Whisper
  router.post('/command', requireVoiceToken, (req, res) => {
    const parse = CommandSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
      return;
    }
    const { transcript, durationMs } = parse.data;

    const start = Date.now();
    const { matchedHandler, response } = voiceRouter.route(transcript);

    const loggedDurationMs = durationMs ?? (Date.now() - start);

    voiceCmdRepo.insert({ transcript, matched_handler: matchedHandler, response, duration_ms: loggedDurationMs });

    eventBus.emit('voice:command', { transcript, matchedHandler });

    if (response) {
      // Forward TTS response to voice process
      const voicePort = process.env.NESTOR_VOICE_PORT ?? '3001';
      const token = settingsRepo.get('voice_internal_token') as string | null;
      fetch(`http://localhost:${voicePort}/internal/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: response }),
        signal: AbortSignal.timeout(3_000),
      }).catch((err) => logger.warn({ err }, 'internalVoice: failed to forward TTS'));
    }

    res.status(204).end();
  });

  // POST /internal/voice/status — voice process reports its current status
  router.post('/status', requireVoiceToken, (req, res) => {
    const parse = StatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }
    eventBus.emit('voice:status', parse.data);
    res.status(204).end();
  });

  return router;
}
