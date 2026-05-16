import { z } from 'zod';

// ─── Board Messages ───────────────────────────────────────────────────────────

export interface BoardMessage {
  id: number;
  profile_id: number | null;
  content: string;
  pinned: boolean;
  archived: boolean;
  created_at: number;
}

export const BoardMessageInputSchema = z.object({
  content: z.string().min(1).max(2000),
  pinned: z.boolean().default(false),
});
export type BoardMessageInput = z.infer<typeof BoardMessageInputSchema>;

export const BoardMessageUpdateSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});
export type BoardMessageUpdate = z.infer<typeof BoardMessageUpdateSchema>;

// ─── Countdown Timers ─────────────────────────────────────────────────────────

export interface CountdownTimer {
  id: number;
  name: string;
  target_date: number;
  show_on_home: boolean;
  savings_goal_id: number | null;
  created_at: number;
}

export const CountdownTimerInputSchema = z.object({
  name: z.string().min(1).max(200),
  target_date: z.number().int(),
  show_on_home: z.boolean().default(false),
  savings_goal_id: z.number().int().positive().nullable().optional(),
});
export type CountdownTimerInput = z.infer<typeof CountdownTimerInputSchema>;

export const CountdownTimerUpdateSchema = CountdownTimerInputSchema.partial();
export type CountdownTimerUpdate = z.infer<typeof CountdownTimerUpdateSchema>;

// ─── Whiteboard Snapshots ─────────────────────────────────────────────────────

export interface WhiteboardSnapshot {
  id: number;
  name: string;
  file_path: string;
  thumbnail_path: string | null;
  created_at: number;
}

export const WhiteboardSnapshotInputSchema = z.object({
  name: z.string().min(1).max(200),
});
export type WhiteboardSnapshotInput = z.infer<typeof WhiteboardSnapshotInputSchema>;
