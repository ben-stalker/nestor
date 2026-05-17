import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';
import { getVoiceStatus, type VoiceStatus } from './api';

export const VOICE_STATUS_KEY = ['voice-status'] as const;

export type MicState = 'idle' | 'listening' | 'processing' | 'speaking' | 'offline';

export function useVoiceStatus(): { state: MicState; online: boolean } {
  const { data } = useQuery<VoiceStatus>({
    queryKey: VOICE_STATUS_KEY,
    queryFn: getVoiceStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { lastMessage } = useWebSocket();
  const [liveState, setLiveState] = useState<MicState>('offline');

  useEffect(() => {
    if (!data) return;
    setLiveState(data.online ? (data.status as MicState) : 'offline');
  }, [data]);

  useEffect(() => {
    if (lastMessage?.event === 'voice:status') {
      const { status } = lastMessage.payload as { status: MicState };
      setLiveState(status);
    }
  }, [lastMessage]);

  return { state: liveState, online: data?.online ?? false };
}
