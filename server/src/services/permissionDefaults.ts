import { ALL_PERMISSIONS, type PermissionKey } from '../middleware/permissions';
import type { ProfileType } from '../types/profile';

type Row = Record<PermissionKey, boolean>;

// Build a Row from a granted-set; all other keys default to false.
// "self-only" / "pending-approval" nuances are enforced in module routes, not here.
function row(granted: PermissionKey[]): Row {
  const grantedSet = new Set<string>(granted);
  return Object.fromEntries(ALL_PERMISSIONS.map((k) => [k, grantedSet.has(k)])) as Row;
}

// PRD §5 permission matrix — update snapshots when this changes intentionally.
const MATRIX: Record<ProfileType, Row> = {
  admin: row([...ALL_PERMISSIONS]),

  grandparent: row([
    'view_calendar',
    'view_food',
    'add_recipe',
    'add_to_shopping',
    'tick_shopping',
    'view_vehicles',
    'view_chores',
    'complete_chore',
    'view_health_log',
    'add_health_log',
    'view_house',
    'view_pets',
    'view_board',
    'post_board_message',
    'view_contacts',
  ]),

  teen: row([
    'view_calendar',
    'add_calendar_event',
    'view_food',
    'add_recipe',
    'add_to_shopping', // pending-approval enforced in STORY-5.7
    'tick_shopping',
    'view_vehicles',
    'book_vehicle',
    'view_chores',
    'complete_chore',
    'view_health_log', // self-only scope enforced in STORY-7.6
    'add_health_log',
    'view_house',
    'view_pets',
    'view_board',
    'post_board_message',
    'view_contacts',
  ]),

  child: row([
    'view_calendar',
    'view_food',
    'tick_shopping',
    'view_chores',
    'complete_chore',
    'view_pets',
    'view_board',
    'post_board_message',
    'view_contacts', // emergency-only scope enforced in contacts module
  ]),

  toddler: row(['view_calendar', 'view_chores', 'complete_chore', 'view_pets']),

  baby: row([]),

  guest: row([
    'view_calendar',
    'view_food',
    'tick_shopping',
    'view_chores',
    'view_house',
    'view_pets',
    'view_board',
    'view_contacts',
  ]),
};

export default function defaultsFor(type: ProfileType): Row {
  return { ...MATRIX[type] };
}
