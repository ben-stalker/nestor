import { Moon } from 'lucide-react';
import { useAppSettings } from '../core/hooks/useAppSettings';

interface QuietHoursConfig {
  enabled: boolean;
  start: string;
  end: string;
}

function isNowQuietHours(qh: QuietHoursConfig): boolean {
  if (!qh.enabled) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const parse = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + (m ?? 0);
  };
  const start = parse(qh.start);
  const end = parse(qh.end);
  if (start <= end) return nowMin >= start && nowMin < end;
  return nowMin >= start || nowMin < end;
}

/** Shows a banner when quiet hours are currently active — visible in house/settings area. */
export default function QuietHoursBanner() {
  const { data: settings } = useAppSettings();
  const qh = settings?.quiet_hours as QuietHoursConfig | undefined;

  if (!qh || !isNowQuietHours(qh)) return null;

  return (
    <div className="quiet-hours-banner" role="status" aria-live="polite">
      <Moon size={14} className="quiet-hours-banner__icon" />
      <span>
        Quiet hours active ({qh.start}–{qh.end}) — audio chimes and TTS muted
      </span>
    </div>
  );
}
