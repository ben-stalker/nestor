// Event map for the internal event bus — all in-process pub/sub goes through these channels.
// Payload types should be kept minimal; expand when the domain type lands in its story.

/** Placeholder until AlertRepository lands in STORY-14.1 */
export interface Alert {
  id: number;
  type: string;
  message: string;
  createdAt: number;
}

export interface EventMap {
  'alert:new': Alert;
  'alert:dismissed': { id: number };
  'calendar:synced': { accountId: number; eventCount: number };
  'plugin:enabled': { pluginId: string };
  'plugin:disabled': { pluginId: string };
  'plugin:error': { pluginId: string; error: Error };
  'voice:status': { status: 'idle' | 'listening' | 'processing' | 'speaking' };
  'settings:updated': { keys: string[] };
  'shopping:updated': Record<string, never>;
}
