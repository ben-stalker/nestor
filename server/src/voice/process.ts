/**
 * Nestor Voice Process — runs as a separate Node.js process.
 *
 * Start with:   node dist/voice/process.js
 * Env vars:
 *   NESTOR_VOICE_PORT    Internal HTTP port (default 3001)
 *   NESTOR_MAIN_URL      Main server URL (default http://localhost:3000)
 *   NESTOR_VOICE_TOKEN   Shared secret for IPC auth (from app_settings.voice_internal_token)
 *   WHISPER_MODELS_DIR   Path to whisper ggml model files
 *   PIPER_BIN            Path to piper binary
 *   OWW_SCRIPT           Path to OpenWakeWord detect.py script
 *   WAKEWORD_MODEL       Path to trained wakeword .tflite model
 */
import express from 'express';
import { execFile, spawn } from 'child_process';
import fs from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';
import pino from 'pino';
import { hasUsbAudio } from './audioDetect';
import { WakeWordRunner } from './wakeWordRunner';
import { transcribe, type WhisperModel } from './whisperRunner';
import { TtsQueue } from './TtsQueue';
import { postCommand } from './ipc';

const logger = pino({ name: 'nestor-voice' });

const PORT = Number(process.env.NESTOR_VOICE_PORT ?? 3001);
const INTERNAL_TOKEN = process.env.NESTOR_VOICE_TOKEN ?? '';
const WAKEWORD_MODEL =
  process.env.WAKEWORD_MODEL ??
  path.join(os.homedir(), '.nestor', 'voice', 'wakeword-model.tflite');
const STT_MODEL = (process.env.VOICE_STT_MODEL ?? 'base') as WhisperModel;
const TTS_VOICE = process.env.VOICE_TTS_VOICE ?? 'en_US-lessac-medium';
const SAMPLES_DIR = path.join(os.homedir(), '.nestor', 'voice', 'wakeword-samples');
const RECORD_SECONDS = Number(process.env.VOICE_RECORD_SECONDS ?? 5);

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

let currentStatus: VoiceStatus = 'idle';
let hasAudio = false;
let isCapturing = false;

function isQuietHours(): boolean {
  // The voice process checks quiet hours independently.
  // In production, read from a shared settings file or IPC; for now always false (main server gates audio chimes).
  return false;
}

const ttsQueue = new TtsQueue(isQuietHours);

// --- Internal HTTP server ---

const app = express();
app.use(express.json());

function requireToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization ?? '';
  if (INTERNAL_TOKEN && auth !== `Bearer ${INTERNAL_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

app.get('/internal/voice/status', (_req, res) => {
  res.json({
    status: currentStatus,
    hasAudio,
    wakewordModel: path.basename(WAKEWORD_MODEL),
    sttModel: STT_MODEL,
    ttsModel: TTS_VOICE,
  });
});

app.post('/internal/voice/tts', requireToken, (req, res) => {
  const { text, voiceId } = req.body as { text?: string; voiceId?: string };
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text required' });
    return;
  }
  ttsQueue.enqueue({ text, voiceId: voiceId ?? TTS_VOICE });
  res.status(204).end();
});

// Training: upload audio sample
app.post(
  '/internal/voice/wakeword/samples',
  requireToken,
  express.raw({ type: 'audio/*', limit: '5mb' }),
  (req, res, next) => {
    const buf = req.body as Buffer;
    const filename = path.join(SAMPLES_DIR, `sample-${randomBytes(4).toString('hex')}.wav`);
    mkdir(SAMPLES_DIR, { recursive: true })
      .then(() => writeFile(filename, buf))
      .then(() => res.status(204).end())
      .catch(next);
  },
);

// Training: invoke training script
app.post('/internal/voice/wakeword/train', requireToken, (_req, res) => {
  const trainScript = path.join(os.homedir(), '.nestor', 'voice', 'owww', 'train.py');
  execFile(
    'python3',
    [trainScript, '--samples', SAMPLES_DIR, '--output', WAKEWORD_MODEL],
    { timeout: 300_000 },
    (err) => {
      if (err) {
        logger.warn({ err }, 'wakeword training failed');
        res.status(500).json({ error: err.message });
        return;
      }
      logger.info('wakeword training complete');
      res.status(204).end();
    },
  );
});

// --- Audio capture helper ---

function captureAudio(seconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const outPath = path.join(os.tmpdir(), `nestor-capture-${randomBytes(4).toString('hex')}.wav`);
    const proc = spawn('arecord', [
      '-d',
      String(seconds),
      '-f',
      'S16_LE',
      '-r',
      '16000',
      '-c',
      '1',
      outPath,
    ]);
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(outPath);
      else reject(new Error(`arecord exited ${code}`));
    });
  });
}

// --- Wake → capture → transcribe → IPC loop ---

async function handleWake(): Promise<void> {
  if (isCapturing) return;
  isCapturing = true;
  currentStatus = 'listening';

  logger.info('wake: capturing audio');

  try {
    const wavPath = await captureAudio(RECORD_SECONDS);
    currentStatus = 'processing';

    const { transcript, durationMs } = await transcribe(wavPath, STT_MODEL);

    // Clean up temp file (best-effort)
    fs.unlink(wavPath, () => {});

    if (!transcript) {
      logger.info('wake: silent/empty transcript, ignoring');
      currentStatus = 'idle';
      return;
    }

    logger.info({ transcript, durationMs }, 'wake: transcript ready');
    await postCommand({ transcript, durationMs });
  } catch (err) {
    logger.warn({ err }, 'wake: capture/transcribe failed');
  } finally {
    currentStatus = 'idle';
    isCapturing = false;
  }
}

// --- Main ---

async function main(): Promise<void> {
  hasAudio = await hasUsbAudio();

  if (!hasAudio) {
    logger.info('No USB audio capture device detected — voice process exiting cleanly');
    process.exit(0);
  }

  logger.info('USB audio device detected, starting voice pipeline');

  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Voice internal HTTP server listening');
  });

  const wakeWord = new WakeWordRunner({
    modelPath: WAKEWORD_MODEL,
    onWake: () => {
      void handleWake();
    },
  });

  wakeWord.on('exit', () => {
    // WakeWord process crashed — restart after 5 s
    setTimeout(() => wakeWord.start(), 5_000);
  });

  wakeWord.start();

  process.on('SIGTERM', () => {
    wakeWord.stop();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    wakeWord.stop();
    process.exit(0);
  });
}

void main();
