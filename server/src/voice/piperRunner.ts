import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import logger from '../utils/logger';

const PIPER_BIN = process.env.PIPER_BIN ?? 'piper';
const PIPER_VOICES_DIR =
  process.env.PIPER_VOICES_DIR ?? path.join(os.homedir(), '.nestor', 'models', 'piper');
const DEFAULT_VOICE = 'en_US-lessac-medium';

/**
 * Synthesise text with Piper TTS and play via aplay.
 * Resolves when playback finishes. Rejects silently (logs warning) if piper is unavailable.
 */
export default function speak(text: string, voiceId: string = DEFAULT_VOICE): Promise<void> {
  return new Promise((resolve) => {
    const modelPath = path.join(PIPER_VOICES_DIR, `${voiceId}.onnx`);
    const piper = spawn(PIPER_BIN, ['--model', modelPath, '--output-raw'], {
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const aplay = spawn('aplay', ['-r', '22050', '-f', 'S16_LE', '-t', 'raw', '-'], {
      stdio: ['pipe', 'ignore', 'ignore'],
    });

    piper.stdout.pipe(aplay.stdin);
    piper.stdin.write(text);
    piper.stdin.end();

    piper.on('error', (err) => {
      logger.warn({ err }, 'piper: binary not available or failed');
      resolve();
    });

    aplay.on('error', (err) => {
      logger.warn({ err }, 'aplay: binary not available or failed');
    });

    aplay.on('close', resolve);
    piper.on('close', (code) => {
      if (code !== 0) {
        logger.warn({ code, text: text.slice(0, 60) }, 'piper: non-zero exit');
        resolve();
      }
    });
  });
}
