import { useEffect, useCallback } from 'react';
import { useAppSettings } from './hooks/useAppSettings';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { triggerDpmsOff } from '../api/admin';

const DEFAULT_DIM_SECONDS = 90;
const DEFAULT_SLEEP_SECONDS = 600;
const DEFAULT_DIM_LEVEL = 0.1;
const DEFAULT_NIGHT_DIM_LEVEL = 0.05;

function isInNightWindow(start: string, end: string): boolean {
  const now = new Date();
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  // Handle ranges that cross midnight (e.g. 22:00–07:00)
  if (startMins > endMins) {
    return nowMins >= startMins || nowMins < endMins;
  }
  return nowMins >= startMins && nowMins < endMins;
}

export default function IdleOverlay() {
  const { data: settings } = useAppSettings();

  const dimMs = (settings?.idle_dim_seconds ?? DEFAULT_DIM_SECONDS) * 1000;
  const sleepMs = (settings?.idle_sleep_seconds ?? DEFAULT_SLEEP_SECONDS) * 1000;
  const nightEnabled = settings?.night_mode_enabled ?? false;
  const nightStart = settings?.night_mode_start ?? '22:00';
  const nightEnd = settings?.night_mode_end ?? '07:00';

  const isNight = nightEnabled && isInNightWindow(nightStart, nightEnd);

  const dimLevel = isNight
    ? (settings?.night_mode_dim_level ?? DEFAULT_NIGHT_DIM_LEVEL)
    : (settings?.idle_dim_level ?? DEFAULT_DIM_LEVEL);

  const handleSleep = useCallback(() => {
    if (isNight) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    triggerDpmsOff().catch(() => {});
  }, [isNight]);

  const { idleState, wake } = useIdleTimer({
    dimAfterMs: dimMs,
    sleepAfterMs: sleepMs,
    onSleep: handleSleep,
  });

  // Remove forced dark theme when screen wakes
  useEffect(() => {
    if (idleState === 'active' && isNight) {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [idleState, isNight]);

  if (idleState === 'active') return null;

  return (
    <div
      className="idle-overlay"
      style={{ '--idle-opacity': dimLevel } as React.CSSProperties}
      role="presentation"
      aria-hidden="true"
      data-testid="idle-overlay"
      onPointerDown={wake}
      onTouchStart={wake}
      onClick={wake}
    />
  );
}
