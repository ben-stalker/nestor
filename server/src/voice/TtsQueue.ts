import logger from '../utils/logger';
import speak from './piperRunner';

const ITEM_TIMEOUT_MS = 30_000;

export interface TtsItem {
  text: string;
  voiceId?: string;
}

/**
 * Sequential TTS playback queue.
 * Items are played one at a time; a slow item times out after 30 s so the queue never stalls.
 * Quiet-hours gating is applied per-item at dequeue time via an injected predicate.
 */
export class TtsQueue {
  private queue: TtsItem[] = [];

  private running = false;

  private isQuietHours: () => boolean;

  constructor(isQuietHours: () => boolean = () => false) {
    this.isQuietHours = isQuietHours;
  }

  enqueue(item: TtsItem): void {
    this.queue.push(item);
    void this.drain();
  }

  // eslint-disable-next-line class-methods-use-this
  private playWithTimeout(item: TtsItem): Promise<void> {
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        logger.warn({ text: item.text.slice(0, 60) }, 'TtsQueue: item timed out');
        resolve();
      }, ITEM_TIMEOUT_MS);

      speak(item.text, item.voiceId)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((err: unknown) => {
          clearTimeout(timeout);
          logger.warn({ err, text: item.text.slice(0, 60) }, 'TtsQueue: item failed');
          resolve();
        });
    });
  }

  private async processNext(): Promise<void> {
    const item = this.queue.shift();
    if (!item) return;

    if (this.isQuietHours()) {
      logger.info({ text: item.text.slice(0, 60) }, 'TtsQueue: skipping — quiet hours active');
      return;
    }

    await this.playWithTimeout(item);
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await this.processNext();
    }

    this.running = false;
  }

  get length(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}
