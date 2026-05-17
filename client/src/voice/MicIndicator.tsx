import clsx from 'clsx';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceStatus, type MicState } from './useVoiceStatus';

const STATE_LABELS: Record<MicState, string> = {
  idle: 'Voice idle',
  listening: 'Listening…',
  processing: 'Processing…',
  speaking: 'Speaking…',
  offline: 'Voice offline',
};

export default function MicIndicator() {
  const { state, online } = useVoiceStatus();

  // Hide indicator entirely when voice service is offline (STORY-15.9)
  if (!online) return null;

  const isActive = state !== 'idle';

  return (
    <div
      className={clsx(
        'mic-indicator',
        `mic-indicator--${state}`,
        isActive && 'mic-indicator--active',
      )}
      aria-label={STATE_LABELS[state]}
      title={STATE_LABELS[state]}
    >
      {state === 'processing' && (
        <Loader2 size={16} className="mic-indicator__icon mic-indicator__icon--spin" />
      )}
      {state === 'offline' && <MicOff size={16} className="mic-indicator__icon" />}
      {state !== 'processing' && state !== 'offline' && (
        <Mic size={16} className="mic-indicator__icon" />
      )}
      {isActive && <span className="mic-indicator__label">{STATE_LABELS[state]}</span>}
    </div>
  );
}
