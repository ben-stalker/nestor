import type Database from 'better-sqlite3';
import BaseRepository from './BaseRepository';
import type {
  Checklist,
  ChecklistInput,
  ChecklistUpdate,
  ChecklistItem,
  ChecklistItemInput,
  ChecklistItemUpdate,
} from '../types/house';

interface ChecklistRow {
  id: number;
  name: string;
  type: string;
  auto_reset_cron: string | null;
  template_id: string | null;
  last_reset_at: number | null;
  guest_name: string | null;
  guest_arrival_date: number | null;
  created_at: number;
}

interface ChecklistItemRow {
  id: number;
  checklist_id: number;
  text: string;
  ticked: number;
  sort_order: number;
  section: string | null;
}

function fromChecklistRow(row: ChecklistRow): Checklist {
  return {
    ...row,
    type: row.type as Checklist['type'],
  };
}

function fromItemRow(row: ChecklistItemRow): ChecklistItem {
  return {
    ...row,
    ticked: row.ticked === 1,
  };
}

const TEMPLATES: Array<{
  templateId: string;
  name: string;
  type: Checklist['type'];
  items: Array<{ text: string; sort_order: number; section?: string }>;
}> = [
  {
    templateId: 'nursery-bag',
    name: 'Nursery Bag',
    type: 'daily_reset',
    items: [
      { text: 'Nappies', sort_order: 0 },
      { text: 'Wipes', sort_order: 1 },
      { text: 'Formula', sort_order: 2 },
      { text: 'Spare clothes', sort_order: 3 },
      { text: 'Dummy', sort_order: 4 },
      { text: 'Changing mat', sort_order: 5 },
    ],
  },
  {
    templateId: 'morning-routine',
    name: 'Morning Routine',
    type: 'daily_reset',
    items: [
      { text: 'Breakfast', sort_order: 0 },
      { text: 'Brush teeth', sort_order: 1 },
      { text: 'Wash face', sort_order: 2 },
      { text: 'Get dressed', sort_order: 3 },
      { text: 'Pack bag', sort_order: 4 },
    ],
  },
  {
    templateId: 'bedtime-routine',
    name: 'Bedtime Routine',
    type: 'daily_reset',
    items: [
      { text: 'Bath / wash', sort_order: 0 },
      { text: 'Pyjamas', sort_order: 1 },
      { text: 'Brush teeth', sort_order: 2 },
      { text: 'Story', sort_order: 3 },
      { text: 'Lights out', sort_order: 4 },
    ],
  },
  {
    templateId: 'packing-list',
    name: 'Packing List',
    type: 'trip',
    items: [
      { text: 'Passport', sort_order: 0 },
      { text: 'Phone charger', sort_order: 1 },
      { text: 'Toiletries', sort_order: 2 },
      { text: 'Clothes (3 days)', sort_order: 3 },
      { text: 'Medication', sort_order: 4 },
      { text: 'Travel insurance', sort_order: 5 },
    ],
  },
  {
    templateId: 'day-trip',
    name: 'Day Trip',
    type: 'trip',
    items: [
      { text: 'Snacks', sort_order: 0 },
      { text: 'Water bottles', sort_order: 1 },
      { text: 'Sun cream', sort_order: 2 },
      { text: 'Hats', sort_order: 3 },
      { text: 'First aid kit', sort_order: 4 },
      { text: 'Map / directions', sort_order: 5 },
    ],
  },
  {
    templateId: 'guest-arrival',
    name: 'Guest Arrival',
    type: 'one_off',
    items: [
      { text: 'Fresh towels', sort_order: 0 },
      { text: 'Toiletries in bathroom', sort_order: 1 },
      { text: 'Clean bedding', sort_order: 2 },
      { text: 'Welcome note', sort_order: 3 },
    ],
  },
  {
    templateId: 'guest-departure',
    name: 'Guest Departure',
    type: 'one_off',
    items: [
      { text: 'Strip bed', sort_order: 0 },
      { text: 'Check bathroom', sort_order: 1 },
      { text: 'Check all rooms', sort_order: 2 },
      { text: 'Collect key', sort_order: 3 },
    ],
  },
];

export default class ChecklistRepository extends BaseRepository {
  list(): Checklist[] {
    const rows = this.all<ChecklistRow>('SELECT * FROM checklists ORDER BY created_at DESC');
    return rows.map(fromChecklistRow);
  }

  get(id: number): (Checklist & { items: ChecklistItem[] }) | undefined {
    const row = this.queryOne<ChecklistRow>('SELECT * FROM checklists WHERE id = ?', [id]);
    if (!row) return undefined;
    const items = this.listItems(id);
    return { ...fromChecklistRow(row), items };
  }

  create(input: ChecklistInput): Checklist {
    const result = this.run(
      `INSERT INTO checklists
         (name, type, auto_reset_cron, template_id, guest_name, guest_arrival_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.type,
        input.auto_reset_cron ?? null,
        input.template_id ?? null,
        input.guest_name ?? null,
        input.guest_arrival_date ?? null,
      ],
    );
    const row = this.queryOne<ChecklistRow>('SELECT * FROM checklists WHERE id = ?', [
      result.lastInsertRowid as number,
    ])!;
    return fromChecklistRow(row);
  }

  update(id: number, patch: ChecklistUpdate): Checklist | undefined {
    const fields = Object.keys(patch) as (keyof ChecklistUpdate)[];
    if (fields.length === 0) {
      const row = this.queryOne<ChecklistRow>('SELECT * FROM checklists WHERE id = ?', [id]);
      return row ? fromChecklistRow(row) : undefined;
    }
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => patch[f] ?? null);
    this.run(`UPDATE checklists SET ${setClauses} WHERE id = ?`, [...values, id]);
    const row = this.queryOne<ChecklistRow>('SELECT * FROM checklists WHERE id = ?', [id]);
    return row ? fromChecklistRow(row) : undefined;
  }

  delete(id: number): void {
    this.run('DELETE FROM checklists WHERE id = ?', [id]);
  }

  listItems(checklistId: number): ChecklistItem[] {
    const rows = this.all<ChecklistItemRow>(
      'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY sort_order, id',
      [checklistId],
    );
    return rows.map(fromItemRow);
  }

  createItem(checklistId: number, input: ChecklistItemInput): ChecklistItem {
    const result = this.run(
      'INSERT INTO checklist_items (checklist_id, text, sort_order, section) VALUES (?, ?, ?, ?)',
      [checklistId, input.text, input.sort_order, input.section ?? null],
    );
    const row = this.queryOne<ChecklistItemRow>('SELECT * FROM checklist_items WHERE id = ?', [
      result.lastInsertRowid as number,
    ])!;
    return fromItemRow(row);
  }

  updateItem(id: number, patch: ChecklistItemUpdate): ChecklistItem | undefined {
    const fields = Object.keys(patch) as (keyof ChecklistItemUpdate)[];
    if (fields.length === 0) {
      const row = this.queryOne<ChecklistItemRow>('SELECT * FROM checklist_items WHERE id = ?', [
        id,
      ]);
      return row ? fromItemRow(row) : undefined;
    }
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'ticked') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE checklist_items SET ${setClauses} WHERE id = ?`, [...values, id]);
    const row = this.queryOne<ChecklistItemRow>('SELECT * FROM checklist_items WHERE id = ?', [id]);
    return row ? fromItemRow(row) : undefined;
  }

  deleteItem(id: number): void {
    this.run('DELETE FROM checklist_items WHERE id = ?', [id]);
  }

  tickItem(id: number, ticked: boolean): ChecklistItem | undefined {
    this.run('UPDATE checklist_items SET ticked = ? WHERE id = ?', [ticked ? 1 : 0, id]);
    const row = this.queryOne<ChecklistItemRow>('SELECT * FROM checklist_items WHERE id = ?', [id]);
    return row ? fromItemRow(row) : undefined;
  }

  resetItems(checklistId: number): void {
    this.run('UPDATE checklist_items SET ticked = 0 WHERE checklist_id = ?', [checklistId]);
    this.run('UPDATE checklists SET last_reset_at = ? WHERE id = ?', [Date.now(), checklistId]);
  }

  resetDailyChecklists(): void {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    const rows = this.all<ChecklistRow>(
      `SELECT * FROM checklists WHERE type = 'daily_reset'
       AND (last_reset_at IS NULL OR last_reset_at < ?)`,
      [todayStartMs],
    );

    rows.forEach((row) => this.resetItems(row.id));
  }

  seedTemplates(db?: Database.Database): void {
    const targetDb = db ?? this.db;
    const count = targetDb.prepare<[], { n: number }>('SELECT COUNT(*) as n FROM checklists').get();
    if (!count || count.n > 0) return;

    TEMPLATES.forEach((tpl) => {
      const result = targetDb
        .prepare(`INSERT INTO checklists (name, type, template_id) VALUES (?, ?, ?)`)
        .run(tpl.name, tpl.type, tpl.templateId);
      const checklistId = result.lastInsertRowid as number;
      tpl.items.forEach((item) => {
        targetDb
          .prepare(
            'INSERT INTO checklist_items (checklist_id, text, sort_order, section) VALUES (?, ?, ?, ?)',
          )
          .run(checklistId, item.text, item.sort_order, item.section ?? null);
      });
    });
  }
}
