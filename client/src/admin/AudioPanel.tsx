import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Volume2 } from 'lucide-react';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import { playChime, unlockAudioContext, type ChimeSeverity } from '../alerts/audioChime';
import { DEFAULT_NAV_MODES } from '../core/navModes';
import apiFetch from '../api/client';
import useAppStore from '../store/appStore';

const CHIME_MODULES = DEFAULT_NAV_MODES.filter((m) => m.id !== 'home');

async function saveAudioChimeSettings(body: {
  audio_chime_categories?: Record<string, boolean>;
  audio_chime_volume?: number;
}): Promise<void> {
  await apiFetch<void>('/api/v1/admin/audio-chime', { method: 'PATCH', body });
}

export default function AudioPanel() {
  const adminPin = useAppStore((s) => s.adminPin);
  const { data: settings } = useAppSettings();
  const queryClient = useQueryClient();

  const savedCategories = (settings?.audio_chime_categories ?? {}) as Record<string, boolean>;
  const savedVolume = typeof settings?.audio_chime_volume === 'number' ? settings.audio_chime_volume : 0.5;

  const [volume, setVolume] = useState(savedVolume);

  useEffect(() => {
    setVolume(savedVolume);
  }, [savedVolume]);

  const mutation = useMutation({
    mutationFn: saveAudioChimeSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  function isCategoryEnabled(navMode: string): boolean {
    if (navMode in savedCategories) return savedCategories[navMode];
    return true;
  }

  function toggleCategory(navMode: string, enabled: boolean) {
    unlockAudioContext();
    const next = { ...savedCategories, [navMode]: enabled };
    mutation.mutate({ audio_chime_categories: next });
  }

  function commitVolume(val: number) {
    unlockAudioContext();
    mutation.mutate({ audio_chime_volume: val });
  }

  function previewChime(severity: ChimeSeverity) {
    unlockAudioContext();
    playChime(severity, volume);
  }

  const isAdmin = Boolean(adminPin);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Volume2 size={18} className="text-mode-house" />
        <span className="text-body font-semibold">Audio Notifications</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-caption font-medium text-secondary">Volume</span>
          <span className="text-caption text-secondary">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          disabled={!isAdmin}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          onMouseUp={(e) => commitVolume(parseFloat((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => commitVolume(parseFloat((e.target as HTMLInputElement).value))}
          className="w-full accent-mode-house"
          aria-label="Chime volume"
        />

        <div className="flex gap-2 flex-wrap mt-1">
          {(['info', 'warning', 'error', 'success'] as ChimeSeverity[]).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => previewChime(sev)}
              className="px-3 py-1 rounded-full text-caption bg-neutral-100 hover:bg-neutral-200 capitalize transition-colors"
            >
              Preview {sev === 'error' ? 'urgent' : sev}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-caption font-medium text-secondary mb-2">Chime per module</p>
        {CHIME_MODULES.map((mode) => (
          <div
            key={mode.id}
            className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
          >
            <div className="flex items-center gap-2">
              <mode.Icon size={16} className={`text-${mode.accent}`} />
              <span className="text-body">{mode.label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isCategoryEnabled(mode.id)}
                disabled={!isAdmin}
                onChange={(e) => toggleCategory(mode.id, e.target.checked)}
                aria-label={`Enable chime for ${mode.label}`}
              />
              <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-mode-house peer-disabled:opacity-50 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <p className="text-caption text-secondary">Admin access required to change audio settings.</p>
      )}
    </div>
  );
}
