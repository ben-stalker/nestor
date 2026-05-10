import { useEffect, useRef, useState, useCallback } from 'react';

export type IdleState = 'active' | 'dim' | 'sleep';

interface IdleTimerOptions {
  dimAfterMs: number;
  sleepAfterMs: number;
  onSleep?: () => void;
}

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'touchmove',
  'pointerdown',
  'pointermove',
  'scroll',
  'wheel',
] as const;

export function useIdleTimer({ dimAfterMs, sleepAfterMs, onSleep }: IdleTimerOptions): {
  idleState: IdleState;
  wake: () => void;
} {
  const [idleState, setIdleState] = useState<IdleState>('active');
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSleepRef = useRef(onSleep);
  onSleepRef.current = onSleep;

  const clearTimers = useCallback(() => {
    if (dimTimerRef.current !== null) {
      clearTimeout(dimTimerRef.current);
      dimTimerRef.current = null;
    }
    if (sleepTimerRef.current !== null) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    dimTimerRef.current = setTimeout(() => {
      setIdleState('dim');
      sleepTimerRef.current = setTimeout(() => {
        setIdleState('sleep');
        onSleepRef.current?.();
      }, sleepAfterMs - dimAfterMs);
    }, dimAfterMs);
  }, [dimAfterMs, sleepAfterMs, clearTimers]);

  const wake = useCallback(() => {
    setIdleState('active');
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    scheduleTimers();

    const handleActivity = () => wake();

    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [wake, scheduleTimers, clearTimers]);

  return { idleState, wake };
}
