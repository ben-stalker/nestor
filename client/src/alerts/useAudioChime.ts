import { useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppSettings } from '../core/hooks/useAppSettings';
import { playChime, type ChimeSeverity } from './audioChime';
import type { AppSettings } from '../core/hooks/useAppSettings';
import type { Alert } from '../api/alerts';

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

function isQuietHours(qh: QuietHours | undefined): boolean {
  if (!qh?.enabled) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const parseHHMM = (s: string): number => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + (m ?? 0);
  };

  const start = parseHHMM(qh.start);
  const end = parseHHMM(qh.end);

  if (start <= end) {
    return nowMinutes >= start && nowMinutes < end;
  }
  // wraps midnight
  return nowMinutes >= start || nowMinutes < end;
}

export default function useAudioChime(): void {
  const { lastMessage } = useWebSocket();
  const { data: settings } = useAppSettings();
  const settingsRef = useRef<AppSettings | undefined>(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (lastMessage?.event !== 'alert:new') return;

    const s = settingsRef.current;
    if (!s) return;

    if (isQuietHours(s.quiet_hours as QuietHours | undefined)) return;

    const alert = lastMessage.payload as Partial<Alert>;
    const navMode = alert.nav_mode_badge;
    const categories = s.audio_chime_categories as Record<string, boolean> | undefined;

    if (categories && navMode != null && categories[navMode] === false) return;

    const volume = typeof s.audio_chime_volume === 'number' ? s.audio_chime_volume : 0.5;
    const rawSeverity = alert.severity ?? 'info';
    let severity: ChimeSeverity = 'info';
    if (rawSeverity === 'error') severity = 'error';
    else if (rawSeverity === 'warning') severity = 'warning';

    playChime(severity, volume);
  }, [lastMessage]);
}
