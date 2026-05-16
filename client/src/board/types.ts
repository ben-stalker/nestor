export interface BoardMessage {
  id: number;
  profile_id: number | null;
  content: string;
  pinned: boolean;
  archived: boolean;
  created_at: number;
}

export interface CountdownTimer {
  id: number;
  name: string;
  target_date: number;
  show_on_home: boolean;
  savings_goal_id: number | null;
  created_at: number;
}

export interface WhiteboardSnapshot {
  id: number;
  name: string;
  file_path: string;
  thumbnail_path: string | null;
  created_at: number;
}

export interface BoardList {
  id: number;
  name: string;
  type: 'one_off' | 'recurring';
  auto_reset_cron: string | null;
  template_id: string | null;
  last_reset_at: number | null;
  guest_name: string | null;
  guest_arrival_date: number | null;
  created_at: number;
  items?: BoardListItem[];
}

export interface BoardListItem {
  id: number;
  checklist_id: number;
  text: string;
  ticked: boolean;
  sort_order: number;
  section: string | null;
}
