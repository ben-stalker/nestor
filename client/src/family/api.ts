import apiFetch from '../api/client';
import type {
  Chore,
  ChoreCompletion,
  RewardSummary,
  RewardGrid,
  ChildSummary,
  HealthLog,
  HealthLogType,
} from './types';

// ─── Chores ──────────────────────────────────────────────────────────────────

export function getChores(profileId?: number): Promise<Chore[]> {
  const qs = profileId !== undefined ? `?profileId=${profileId}` : '';
  return apiFetch<Chore[]>(`/api/v1/chores${qs}`);
}

export function createChore(input: object): Promise<Chore> {
  return apiFetch<Chore>('/api/v1/chores', { method: 'POST', body: input });
}

export function updateChore(id: number, patch: object): Promise<Chore> {
  return apiFetch<Chore>(`/api/v1/chores/${id}`, { method: 'PATCH', body: patch });
}

export function deleteChore(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/chores/${id}`, { method: 'DELETE' });
}

export function completeChore(id: number): Promise<ChoreCompletion> {
  return apiFetch<ChoreCompletion>(`/api/v1/chores/${id}/complete`, { method: 'PATCH' });
}

// ─── Rewards ──────────────────────────────────────────────────────────────────

export function getRewards(profileId: number): Promise<RewardSummary> {
  return apiFetch<RewardSummary>(`/api/v1/rewards/${profileId}`);
}

export function getRewardGrid(profileId: number): Promise<RewardGrid> {
  return apiFetch<RewardGrid>(`/api/v1/rewards/${profileId}/grid`);
}

export function redeemReward(profileId: number, input: object): Promise<void> {
  return apiFetch<void>(`/api/v1/rewards/${profileId}/redeem`, { method: 'POST', body: input });
}

// ─── Family summary ───────────────────────────────────────────────────────────

export function getFamilySummary(): Promise<ChildSummary[]> {
  return apiFetch<ChildSummary[]>('/api/v1/family/summary');
}

// ─── Health log ───────────────────────────────────────────────────────────────

export function getHealthLog(profileId: number, logType?: HealthLogType): Promise<HealthLog[]> {
  const qs = logType ? `?logType=${logType}` : '';
  return apiFetch<HealthLog[]>(`/api/v1/health-log/${profileId}${qs}`);
}

export function createHealthLog(profileId: number, input: object): Promise<HealthLog> {
  return apiFetch<HealthLog>(`/api/v1/health-log/${profileId}`, { method: 'POST', body: input });
}

export function updateHealthLog(id: number, patch: object): Promise<HealthLog> {
  return apiFetch<HealthLog>(`/api/v1/health-log/entries/${id}`, { method: 'PATCH', body: patch });
}

export function deleteHealthLog(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/health-log/entries/${id}`, { method: 'DELETE' });
}

export function exportHealthLogPdf(profileId: number): string {
  return `/api/v1/health-log/${profileId}/export.pdf`;
}

// ─── Baby tracking ────────────────────────────────────────────────────────────

export interface BabySummary {
  todayFeedCount: number;
  todayNappyCount: number;
  lastFeedMs: number | null;
  lastSleepEntry: HealthLog | null;
  recentEntries: HealthLog[];
}

export function getBabySummary(profileId: number): Promise<BabySummary> {
  return apiFetch<BabySummary>(`/api/v1/health-log/${profileId}/baby-summary`);
}

// ─── Growth data ──────────────────────────────────────────────────────────────

export interface GrowthPoint {
  logged_at: number;
  age_weeks: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  head_cm: number | null;
  value_kg: number | null;
}

export interface GrowthData {
  dobMs: number | null;
  points: GrowthPoint[];
}

export function getGrowthData(profileId: number): Promise<GrowthData> {
  return apiFetch<GrowthData>(`/api/v1/health-log/${profileId}/growth-data`);
}

// ─── Vaccinations ─────────────────────────────────────────────────────────────

export interface VaccinationItem {
  id: string;
  name: string;
  age_weeks: number;
  description: string;
  dueAt: number;
  completed: boolean;
  completed_at: number | null;
}

export function getVaccinations(profileId: number): Promise<VaccinationItem[]> {
  return apiFetch<VaccinationItem[]>(`/api/v1/health-log/${profileId}/vaccinations`);
}

// ─── Mood trend ───────────────────────────────────────────────────────────────

export interface MoodTrendPoint {
  date: string;
  score: number;
}

export function getMoodTrend(profileId: number): Promise<MoodTrendPoint[]> {
  return apiFetch<MoodTrendPoint[]>(`/api/v1/health-log/${profileId}/mood-trend`);
}
