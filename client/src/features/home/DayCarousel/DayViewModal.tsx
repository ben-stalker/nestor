import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import useReducedMotion from '../../../hooks/useReducedMotion';
import type { DayData } from './types';

const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface DayViewModalProps {
  day: DayData | null;
  onClose: () => void;
}

export default function DayViewModal({ day, onClose }: DayViewModalProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {day && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${DAY_NAMES_FULL[day.date.getDay()]} ${day.date.getDate()} ${MONTH_NAMES_FULL[day.date.getMonth()]}`}
            className="day-view-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }
            }
          >
            <div className="day-view-modal__header">
              <div>
                <p className="day-view-modal__day-name">{DAY_NAMES_FULL[day.date.getDay()]}</p>
                <p className="day-view-modal__date">
                  {day.date.getDate()} {MONTH_NAMES_FULL[day.date.getMonth()]}
                </p>
              </div>
              <button
                className="day-view-modal__close"
                onClick={onClose}
                aria-label="Close day view"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="day-view-modal__body">
              {day.events.length === 0 ? (
                <p className="day-view-modal__empty">Nothing scheduled</p>
              ) : (
                <ul className="day-view-modal__events">
                  {day.events.map((ev) => (
                    <li
                      key={ev.id}
                      className="day-view-modal__event"
                      style={{ borderLeftColor: ev.profileColour }}
                    >
                      <span className="day-view-modal__event-time">{ev.startTime}</span>
                      <span className="day-view-modal__event-title">{ev.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
