import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import FocusLock from 'react-focus-lock';
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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center portrait:items-end landscape:items-center">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={clsx(
          'absolute inset-0 bg-black/50',
          !reducedMotion && 'transition-opacity duration-200',
        )}
        onClick={onClose}
      />
      {/* Dialog panel */}
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            'relative z-10 w-full rounded-t-card bg-surface p-6',
            'portrait:w-full landscape:max-w-lg landscape:rounded-card',
            !reducedMotion && 'transition-transform duration-200',
            className,
          )}
        >
          {title && <h2 className="mb-4 text-h2 font-semibold text-primary">{title}</h2>}
          {children}
        </div>
      </FocusLock>
    </div>,
    document.body,
  );
}
