import apiFetch from '../api/client';

export interface VoiceStatus {
  online: boolean;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'offline';
  hasAudio?: boolean;
  wakewordModel?: string;
  sttModel?: string;
  ttsModel?: string;
}

export interface VoiceCommand {
  id: number;
  created_at: number;
  transcript: string;
  matched_handler: string | null;
  response: string | null;
  duration_ms: number | null;
}

export async function getVoiceStatus(): Promise<VoiceStatus> {
  return apiFetch<VoiceStatus>('/api/v1/voice/status');
}

export async function getVoiceCommands(limit = 100): Promise<VoiceCommand[]> {
  return apiFetch<VoiceCommand[]>(`/api/v1/admin/voice-commands?limit=${limit}`);
}

export async function clearVoiceCommands(): Promise<void> {
  await apiFetch<void>('/api/v1/admin/voice-commands', { method: 'DELETE' });
}

export async function startWakewordTraining(wakePhrase?: string): Promise<void> {
  await apiFetch<void>('/api/v1/voice/wakeword/start-training', {
    method: 'POST',
    body: JSON.stringify({ wakePhrase }),
  });
}
