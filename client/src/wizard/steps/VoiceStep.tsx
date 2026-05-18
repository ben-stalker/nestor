import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mic, MicOff } from 'lucide-react';
import apiFetch from '../../api/client';
import { patchSettings } from '../api';

interface VoiceStatus {
  online: boolean;
  status: string;
  hasAudio?: boolean;
}

interface VoiceStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function VoiceStep({ onNext, onSkip }: VoiceStepProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: voiceStatus } = useQuery<VoiceStatus>({
    queryKey: ['voice-status'],
    queryFn: () => apiFetch('/api/v1/voice/status'),
    retry: false,
    staleTime: 30_000,
  });

  const hasAudio = voiceStatus?.hasAudio !== false;

  async function handleNext() {
    if (hasAudio) {
      setSaving(true);
      try {
        await patchSettings({ voice_enabled: voiceEnabled });
      } finally {
        setSaving(false);
      }
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      <p className="text-body text-secondary">
        Check if voice control hardware is available for your Nestor display.
      </p>

      <div
        className={`flex items-center gap-3 p-4 rounded-2xl border ${
          hasAudio ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        {hasAudio ? (
          <Mic size={20} className="text-green-600 shrink-0" />
        ) : (
          <MicOff size={20} className="text-neutral-400 shrink-0" />
        )}
        <div>
          <p className="text-body font-semibold text-primary">
            {hasAudio ? 'Voice hardware detected' : 'No audio device detected'}
          </p>
          <p className="text-caption text-secondary">
            {hasAudio
              ? `Status: ${voiceStatus?.status ?? 'ready'}`
              : 'You can set up voice control later in Admin settings.'}
          </p>
        </div>
      </div>

      {hasAudio && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <div>
            <p className="text-body font-medium text-primary">Enable voice control</p>
            <p className="text-caption text-secondary">Allow Nestor to respond to voice commands</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      )}

      <div className="pt-2 flex justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="px-5 py-2.5 rounded-button font-medium text-secondary hover:bg-neutral-100 transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => {
            void handleNext();
          }}
          disabled={saving}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Next'}
        </button>
      </div>
    </div>
  );
}
