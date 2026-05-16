import BaseRepository from './BaseRepository';
import type { WhiteboardSnapshot, WhiteboardSnapshotInput } from '../types/board';

interface SnapshotRow {
  id: number;
  name: string;
  file_path: string;
  thumbnail_path: string | null;
  created_at: number;
}

export default class WhiteboardRepository extends BaseRepository {
  list(): WhiteboardSnapshot[] {
    return this.all<SnapshotRow>(
      'SELECT * FROM whiteboard_snapshots ORDER BY created_at DESC',
    );
  }

  get(id: number): WhiteboardSnapshot | undefined {
    return this.queryOne<SnapshotRow>('SELECT * FROM whiteboard_snapshots WHERE id = ?', [id]) ?? undefined;
  }

  create(input: WhiteboardSnapshotInput & { file_path: string; thumbnail_path?: string }): WhiteboardSnapshot {
    const result = this.run(
      'INSERT INTO whiteboard_snapshots (name, file_path, thumbnail_path) VALUES (?, ?, ?)',
      [input.name, input.file_path, input.thumbnail_path ?? null],
    );
    return this.queryOne<SnapshotRow>('SELECT * FROM whiteboard_snapshots WHERE id = ?', [
      result.lastInsertRowid as number,
    ])!;
  }

  updateName(id: number, name: string): WhiteboardSnapshot | undefined {
    this.run('UPDATE whiteboard_snapshots SET name = ? WHERE id = ?', [name, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM whiteboard_snapshots WHERE id = ?', [id]);
  }
}
