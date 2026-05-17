import BaseRepository from './BaseRepository';

export interface VoiceCommand {
  id: number;
  created_at: number;
  transcript: string;
  matched_handler: string | null;
  response: string | null;
  duration_ms: number | null;
}

export interface InsertVoiceCommand {
  transcript: string;
  matched_handler?: string | null;
  response?: string | null;
  duration_ms?: number | null;
}

class VoiceCommandRepository extends BaseRepository {
  insert(cmd: InsertVoiceCommand): number {
    const result = this.run(
      `INSERT INTO voice_command_log (transcript, matched_handler, response, duration_ms)
       VALUES (?, ?, ?, ?)`,
      [cmd.transcript, cmd.matched_handler ?? null, cmd.response ?? null, cmd.duration_ms ?? null],
    );
    return result.lastInsertRowid as number;
  }

  list(limit = 100): VoiceCommand[] {
    return this.all<VoiceCommand>(
      'SELECT * FROM voice_command_log ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
  }

  clearAll(): void {
    this.run('DELETE FROM voice_command_log');
  }
}

export default VoiceCommandRepository;
