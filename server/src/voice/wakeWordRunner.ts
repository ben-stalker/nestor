import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import logger from '../utils/logger';

const OWWW_SCRIPT =
  process.env.OWW_SCRIPT ??
  path.join(os.homedir(), '.nestor', 'voice', 'owww', 'detect.py');

export interface WakeWordRunnerOptions {
  modelPath: string;
  /** Called each time the wake word fires */
  onWake: () => void;
}

export class WakeWordRunner extends EventEmitter {
  private proc: ChildProcess | null = null;

  private modelPath: string;

  private onWake: () => void;

  constructor(opts: WakeWordRunnerOptions) {
    super();
    this.modelPath = opts.modelPath;
    this.onWake = opts.onWake;
  }

  start(): void {
    if (this.proc) return;

    logger.info({ model: this.modelPath }, 'wakeWord: starting OpenWakeWord');

    this.proc = spawn('python3', [OWWW_SCRIPT, '--model', this.modelPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.proc.stdout?.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim();
      // detect.py prints "WAKE" when threshold exceeded
      if (line === 'WAKE') {
        logger.info('wakeWord: wake event detected');
        this.onWake();
      }
    });

    this.proc.stderr?.on('data', (chunk: Buffer) => {
      logger.debug({ msg: chunk.toString().trim() }, 'wakeWord: stderr');
    });

    this.proc.on('exit', (code, signal) => {
      this.proc = null;
      logger.warn({ code, signal }, 'wakeWord: process exited');
      this.emit('exit', code, signal);
    });

    this.proc.on('error', (err) => {
      logger.warn({ err }, 'wakeWord: failed to start (python3 / script missing)');
      this.proc = null;
      this.emit('exit', null, null);
    });
  }

  stop(): void {
    if (this.proc) {
      this.proc.kill('SIGTERM');
      this.proc = null;
    }
  }
}
