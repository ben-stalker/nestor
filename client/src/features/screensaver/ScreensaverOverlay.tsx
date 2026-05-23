/**
 * ScreensaverOverlay — EPIC-22 STORY-22.8
 *
 * Renders a full-screen clock overlay after the device has been idle for a
 * configurable timeout.  Features:
 * - Fade-in transition when idle (500 ms)
 * - Fade-out when user touches / clicks
 * - Clock in the centre on a dark background
 * - Ken Burns CSS effect on background if photos were to be shown
 * - Reduced-motion: instant show/hide, no Ken Burns
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useAppSettings } from '../../core/hooks/useAppSettings';

const DEFAULT_SCREENSAVER_SECONDS = 300; // 5 minutes

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'pointerdown',
] as const;

export default function ScreensaverOverlay() {
  const rm = useReducedMotion();
  const { data: settings } = useAppSettings();
  const time = useClock();
  const [visible, setVisible] = useState(false);

  const idleMs =
    ((settings as Record<string, unknown> | undefined)?.screensaver_idle_seconds as number ??
      DEFAULT_SCREENSAVER_SECONDS) * 1000;

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function resetTimer() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(show, idleMs);
    }

    function handleActivity() {
      if (visible) return; // ignore activity while screensaver is showing
      resetTimer();
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [idleMs, show, visible]);

  const overlayVariants = rm
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.05 } },
        exit: { opacity: 0, transition: { duration: 0.05 } },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number] } },
        exit: { opacity: 0, transition: { duration: 0.3, ease: [0.4, 0.0, 1, 1] as [number, number, number, number] } },
      };

  const hours = time.getHours();
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dateStr = `${dayNames[time.getDay()]}, ${time.getDate()} ${monthNames[time.getMonth()]}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="screensaver"
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
          aria-label="Screensaver — tap to wake"
          role="presentation"
          onPointerDown={hide}
          onTouchStart={hide}
          onClick={hide}
        >
          {/* Ken Burns background decoration */}
          {!rm && (
            <div
              aria-hidden="true"
              className="animate-ken-burns absolute inset-0 opacity-5"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(245,166,35,0.4) 0%, transparent 70%)',
              }}
            />
          )}

          {/* Clock */}
          <div className="relative flex flex-col items-center gap-3 select-none">
            <div
              className="font-playfair text-white"
              style={{ fontSize: 'clamp(4rem, 12vw, 8rem)', lineHeight: 1, letterSpacing: '-0.02em' }}
              aria-live="off"
            >
              {displayHours}:{minutes}
              <span style={{ fontSize: '0.45em', opacity: 0.7 }}>{seconds}</span>
              <span
                className="ml-3 font-sans"
                style={{ fontSize: '0.35em', opacity: 0.6, letterSpacing: '0.05em' }}
              >
                {ampm}
              </span>
            </div>

            <p
              className="font-sans text-white/60"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', letterSpacing: '0.04em' }}
            >
              {dateStr}
            </p>

            <p className="mt-6 text-white/30 text-sm tracking-widest uppercase">
              Tap anywhere to wake
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
