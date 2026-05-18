import { execFile } from 'child_process';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import logger from '../utils/logger';

export interface UpdateStatus {
  current: string;
  available: string | null;
  hasUpdate: boolean;
}

export interface RollbackResult {
  status: 'not_implemented';
}

export class UpdateService {
  private readonly settingsRepo: AppSettingsRepository;

  constructor(settingsRepo: AppSettingsRepository) {
    this.settingsRepo = settingsRepo;
  }

  checkForUpdate(): UpdateStatus {
    const current = process.env.NESTOR_VERSION ?? 'unknown';
    const available = this.settingsRepo.get<string | null>('update_available_version') ?? null;
    const hasUpdate = available !== null && available !== current;
    return { current, available, hasUpdate };
  }

  static applyUpdate(): void {
    execFile(
      'sh',
      ['-c', 'git pull --rebase && npm run build && systemctl restart nestor-server'],
      (err) => {
        if (err) logger.warn({ err }, 'system update script failed');
      },
    );
  }

  static rollback(): RollbackResult {
    return { status: 'not_implemented' };
  }
}
