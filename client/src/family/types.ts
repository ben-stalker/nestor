import type { Profile } from '../api/profiles';

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  assigned_profile_id: number | null;
  points: number;
  frequency: 'daily' | 'weekly' | 'one_off';
  active: boolean;
  sort_order: number;
  created_at: number;
}

export interface ChoreCompletion {
  id: number;
  chore_id: number;
  profile_id: number;
  completed_at: number;
  points_awarded: number;
}

export interface RewardRedemption {
  id: number;
  profile_id: number;
  points_spent: number;
  reward_label: string;
  redeemed_at: number;
}

export interface RewardSummary {
  balance: number;
  recentCompletions: ChoreCompletion[];
  recentRedemptions: RewardRedemption[];
}

export interface RewardGrid {
  filled: number;
  total: number;
  totalEarned: number;
  streak: number;
}

export interface ChildSummary {
  profile: Profile;
  todayChores: number;
  todayChoreTotal: number;
  pointsBalance: number;
  nextEvent: {
    id: number;
    title: string;
    start_datetime: number;
  } | null;
}

export type HealthLogType =
  | 'medicine'
  | 'temperature'
  | 'symptom'
  | 'vaccination'
  | 'growth'
  | 'feed'
  | 'nappy'
  | 'sleep'
  | 'mood'
  | 'weight';

export interface HealthLog {
  id: number;
  profile_id: number;
  log_type: HealthLogType;
  data_json: Record<string, unknown>;
  logged_at: number;
}
