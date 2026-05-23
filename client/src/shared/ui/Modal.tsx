import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import FocusLock from 'react-focus-lock';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import useReducedMotion from '../../hooks/useReducedMotion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Modal({ open, onClose, children, title, className }: ModalProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return () => {};
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const panelVariants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: { y: '100%', opacity: 0 },
        animate: {
          y: 0,
          opacity: 1,
          transition: { type: 'spring' as const, damping: 26, stiffness: 340 },
        },
        exit: {
          y: '30%',
          opacity: 0,
          transition: { duration: 0.15, ease: [0.4, 0.0, 1, 1] as [number, number, number, number] },
        },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center portrait:items-end landscape:items-center">
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: reducedMotion ? 0.05 : 0.2 } }}
            exit={{ opacity: 0, transition: { duration: reducedMotion ? 0.05 : 0.15 } }}
            onClick={onClose}
          />
          {/* Dialog panel */}
          <FocusLock returnFocus>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={clsx(
                'relative z-10 w-full rounded-t-card bg-surface p-6',
                'portrait:w-full landscape:max-w-lg landscape:rounded-card',
                className,
              )}
            >
              {title && <h2 className="mb-4 text-h2 font-semibold text-primary">{title}</h2>}
              {children}
            </motion.div>
          </FocusLock>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
