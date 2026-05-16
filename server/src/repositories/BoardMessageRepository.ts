import BaseRepository from './BaseRepository';
import type { BoardMessage, BoardMessageInput, BoardMessageUpdate } from '../types/board';

interface MessageRow {
  id: number;
  profile_id: number | null;
  content: string;
  pinned: number;
  archived: number;
  created_at: number;
}

function fromRow(row: MessageRow): BoardMessage {
  return {
    ...row,
    pinned: row.pinned === 1,
    archived: row.archived === 1,
  };
}

export default class BoardMessageRepository extends BaseRepository {
  listActive(): BoardMessage[] {
    const rows = this.all<MessageRow>(
      'SELECT * FROM board_messages WHERE archived = 0 ORDER BY pinned DESC, created_at DESC',
    );
    return rows.map(fromRow);
  }

  list(): BoardMessage[] {
    const rows = this.all<MessageRow>(
      'SELECT * FROM board_messages ORDER BY pinned DESC, created_at DESC',
    );
    return rows.map(fromRow);
  }

  get(id: number): BoardMessage | undefined {
    const row = this.queryOne<MessageRow>('SELECT * FROM board_messages WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(profileId: number | null, input: BoardMessageInput): BoardMessage {
    const result = this.run(
      'INSERT INTO board_messages (profile_id, content, pinned) VALUES (?, ?, ?)',
      [profileId, input.content, input.pinned ? 1 : 0],
    );
    const row = this.queryOne<MessageRow>('SELECT * FROM board_messages WHERE id = ?', [
      result.lastInsertRowid as number,
    ])!;
    return fromRow(row);
  }

  update(id: number, patch: BoardMessageUpdate): BoardMessage | undefined {
    const fields = Object.keys(patch) as (keyof BoardMessageUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'pinned' || f === 'archived') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE board_messages SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM board_messages WHERE id = ?', [id]);
  }

  archive(id: number): BoardMessage | undefined {
    this.run('UPDATE board_messages SET archived = 1 WHERE id = ?', [id]);
    return this.get(id);
  }
}
