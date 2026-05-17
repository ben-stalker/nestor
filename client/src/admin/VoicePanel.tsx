import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mic, MicOff, Save } from 'lucide-react';
import apiFetch from '../api/client';
import { useAppSettings, APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import { playChime, unlockAudioContext, type ChimeSeverity } from '../alerts/audioChime';
import { DEFAULT_NAV_MODES } from '../core/navModes';
import Button from '../shared/ui/Button';

const CHIME_MODULES = DEFAULT_NAV_MODES.filter((m) => m.id !== 'home');

interface VoiceStatus {
  online: boolean;
  status: string;
  hasAudio?: boolean;
}

interface VoiceForm {
  voice_hub_name: string;
  voice_enabled: boolean;
  voice_stt_model: string;
  voice_tts_voice: string;
  voice_tts_speed: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  audio_chime_volume: number;
  audio_chime_categories: Record<string, boolean>;
}

function buildForm(settings: Record<string, unknown>): VoiceForm {
  const qh =
    (settings.quiet_hours as { enabled?: boolean; start?: string; end?: string } | undefined) ?? {};
  return {
    voice_hub_name: (settings.voice_hub_name as string) ?? 'Nestor',
    voice_enabled: (settings.voice_enabled as boolean) ?? false,
    voice_stt_model: (settings.voice_stt_model as string) ?? 'base',
    voice_tts_voice: (settings.voice_tts_voice as string) ?? 'en_GB-jenny',
    voice_tts_speed: (settings.voice_tts_speed as number) ?? 1.0,
    quiet_hours_enabled: qh.enabled ?? false,
    quiet_hours_start: qh.start ?? '22:00',
    quiet_hours_end: qh.end ?? '07:00',
    audio_chime_volume: (settings.audio_chime_volume as number) ?? 0.5,
    audio_chime_categories: (settings.audio_chime_categories as Record<string, boolean>) ?? {},
  };
}

export default function VoicePanel() {
  const { data: settings } = useAppSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<VoiceForm>(buildForm({}));

  useEffect(() => {
    if (settings) setForm(buildForm(settings as Record<string, unknown>));
  }, [settings]);

  const { data: voiceStatus } = useQuery<VoiceStatus>({
    queryKey: ['voice-status'],
    queryFn: () => apiFetch('/api/v1/voice/status'),
    retry: false,
    staleTime: 30_000,
  });

  const mut = useMutation({
    mutationFn: async (f: VoiceForm) => {
      await apiFetch('/api/v1/settings', {
        method: 'PATCH',
        body: {
          voice_hub_name: f.voice_hub_name,
          voice_enabled: f.voice_enabled,
          voice_stt_model: f.voice_stt_model,
          voice_tts_voice: f.voice_tts_voice,
          voice_tts_speed: f.voice_tts_speed,
          quiet_hours: {
            enabled: f.quiet_hours_enabled,
            start: f.quiet_hours_start,
            end: f.quiet_hours_end,
          },
          audio_chime_volume: f.audio_chime_volume,
          audio_chime_categories: f.audio_chime_categories,
        },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });

  const retrain = useMutation({
    mutationFn: () =>
      apiFetch('/api/v1/voice/wakeword/start-training', { method: 'POST', body: {} }),
  });

  function set<K extends keyof VoiceForm>(key: K, value: VoiceForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(id: string, enabled: boolean) {
    set('audio_chime_categories', { ...form.audio_chime_categories, [id]: enabled });
  }

  function isCatEnabled(id: string): boolean {
    return form.audio_chime_categories[id] ?? true;
  }

  const hasAudio = voiceStatus?.hasAudio !== false;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Status */}
      <div
        className={`flex items-center gap-3 p-3 rounded-xl ${hasAudio ? 'bg-green-50 border border-green-200' : 'bg-neutral-50 border border-neutral-200'}`}
      >
        {hasAudio ? (
          <Mic size={16} className="text-green-600" />
        ) : (
          <MicOff size={16} className="text-neutral-400" />
        )}
        <span className="text-caption font-medium text-secondary">
          {hasAudio
            ? `Voice hardware detected · ${voiceStatus?.status ?? 'unknown'}`
            : 'No audio hardware detected — voice features disabled'}
        </span>
      </div>

      {/* Voice settings */}
      <section className="space-y-4">
        <h3 className="text-body font-semibold text-primary">Voice</h3>

        <div className="flex items-center justify-between">
          <label className="text-body text-primary">Enable voice</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.voice_enabled}
              onChange={(e) => set('voice_enabled', e.target.checked)}
              disabled={!hasAudio}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 peer-disabled:opacity-40 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Hub name (wake phrase)
          </label>
          <input
            type="text"
            value={form.voice_hub_name}
            onChange={(e) => set('voice_hub_name', e.target.value)}
            maxLength={50}
            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
            disabled={!hasAudio}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-caption font-medium text-secondary mb-1">STT model</label>
            <select
              value={form.voice_stt_model}
              onChange={(e) => set('voice_stt_model', e.target.value)}
              disabled={!hasAudio}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
            >
              {['tiny', 'base', 'small'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-caption font-medium text-secondary mb-1">TTS voice</label>
            <input
              type="text"
              value={form.voice_tts_voice}
              onChange={(e) => set('voice_tts_voice', e.target.value)}
              disabled={!hasAudio}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              placeholder="en_GB-jenny"
            />
          </div>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            TTS speed ({form.voice_tts_speed.toFixed(1)}×)
          </label>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={form.voice_tts_speed}
            onChange={(e) => set('voice_tts_speed', parseFloat(e.target.value))}
            disabled={!hasAudio}
            className="w-full accent-mode-calendar"
          />
        </div>

        <Button
          variant="secondary"
          onClick={() => retrain.mutate()}
          disabled={!hasAudio || retrain.isPending}
        >
          {retrain.isPending ? 'Starting…' : 'Retrain wake word'}
        </Button>
      </section>

      {/* Quiet hours */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-primary">Quiet hours</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.quiet_hours_enabled}
              onChange={(e) => set('quiet_hours_enabled', e.target.checked)}
            />
            <div className="w-10 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
        {form.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">Start</label>
              <input
                type="time"
                value={form.quiet_hours_start}
                onChange={(e) => set('quiet_hours_start', e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-secondary mb-1">End</label>
              <input
                type="time"
                value={form.quiet_hours_end}
                onChange={(e) => set('quiet_hours_end', e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
              />
            </div>
          </div>
        )}
      </section>

      {/* Audio chimes */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Audio chimes</h3>
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Volume ({Math.round(form.audio_chime_volume * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.audio_chime_volume}
            onChange={(e) => set('audio_chime_volume', parseFloat(e.target.value))}
            className="w-full accent-mode-calendar"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {(['info', 'warning', 'error', 'success'] as ChimeSeverity[]).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => {
                  unlockAudioContext();
                  playChime(sev, form.audio_chime_volume);
                }}
                className="px-3 py-1 rounded-full text-caption bg-neutral-100 hover:bg-neutral-200 capitalize transition-colors"
              >
                Preview {sev === 'error' ? 'urgent' : sev}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-caption font-medium text-secondary">Chime per module</p>
          {CHIME_MODULES.map((mode) => (
            <div
              key={mode.id}
              className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <mode.Icon size={14} className={`text-${mode.accent}`} />
                <span className="text-body text-primary">{mode.label}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isCatEnabled(mode.id)}
                  onChange={(e) => toggleCategory(mode.id, e.target.checked)}
                />
                <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:bg-neutral-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
      </section>

      <Button variant="primary" onClick={() => mut.mutate(form)} disabled={mut.isPending}>
        <Save size={14} /> {mut.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
