import { execFile } from 'child_process';
import path from 'path';
import os from 'os';

export type WhisperModel = 'tiny' | 'base' | 'small';

export interface WhisperResult {
  transcript: string;
  durationMs: number;
}

const MODEL_DIR =
  process.env.WHISPER_MODELS_DIR ?? path.join(os.homedir(), '.nestor', 'models', 'whisper');

const WHISPER_BIN = process.env.WHISPER_BIN ?? 'whisper-cli';

/**
 * Transcribe a WAV file using whisper.cpp.
 * Returns empty string if whisper-cli is unavailable or produces no output.
 */
export function transcribe(wavPath: string, model: WhisperModel = 'base'): Promise<WhisperResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const modelPath = path.join(MODEL_DIR, `ggml-${model}.bin`);
    execFile(
      WHISPER_BIN,
      ['-m', modelPath, '-f', wavPath, '--output-txt', '--no-timestamps', '-l', 'en'],
      { timeout: 30_000 },
      (_err, stdout) => {
        const transcript = (stdout ?? '').trim();
        resolve({ transcript, durationMs: Date.now() - start });
      },
    );
  });
}
