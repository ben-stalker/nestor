/**
 * IPC client: voice process → main Express server.
 * The voice process POSTs transcripts here after Whisper completes.
 */
import logger from '../utils/logger';

const MAIN_BASE = process.env.NESTOR_MAIN_URL ?? 'http://localhost:3000';
const INTERNAL_TOKEN = process.env.NESTOR_VOICE_TOKEN ?? '';

export interface CommandPayload {
  transcript: string;
  durationMs?: number;
}

export async function postCommand(payload: CommandPayload): Promise<void> {
  try {
    const res = await fetch(`${MAIN_BASE}/internal/voice/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'ipc: postCommand non-2xx');
    }
  } catch (err) {
    logger.warn({ err }, 'ipc: postCommand failed');
  }
}
