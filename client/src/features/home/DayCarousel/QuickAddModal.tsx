import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import useReducedMotion from '../../../hooks/useReducedMotion';
import type { DayData } from './types';

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface QuickAddModalProps {
  day: DayData | null;
  onClose: () => void;
}

export default function QuickAddModal({ day, onClose }: QuickAddModalProps) {
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
            aria-label={`Add event on ${day.date.getDate()} ${MONTH_NAMES_SHORT[day.date.getMonth()]}`}
            className="quick-add-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }
            }
          >
            <div className="quick-add-modal__header">
              <p className="quick-add-modal__title">
                Add event — {day.date.getDate()} {MONTH_NAMES_SHORT[day.date.getMonth()]}
              </p>
              <button className="quick-add-modal__close" onClick={onClose} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="quick-add-modal__body">
              <p className="quick-add-modal__placeholder">
                Event creation coming in a later story.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
