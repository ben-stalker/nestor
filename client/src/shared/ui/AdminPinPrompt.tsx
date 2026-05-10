import { useState, useCallback } from 'react';
import { Delete } from 'lucide-react';
import clsx from 'clsx';
import Modal from './Modal';
import { ApiError } from '../../api/client';
import useReducedMotion from '../../hooks/useReducedMotion';

const PIN_LENGTH = 4;

type Key = { id: string; label: string; action: 'digit' | 'delete' | 'spacer' };

const KEYPAD: Key[] = [
  { id: '1', label: '1', action: 'digit' },
  { id: '2', label: '2', action: 'digit' },
  { id: '3', label: '3', action: 'digit' },
  { id: '4', label: '4', action: 'digit' },
  { id: '5', label: '5', action: 'digit' },
  { id: '6', label: '6', action: 'digit' },
  { id: '7', label: '7', action: 'digit' },
  { id: '8', label: '8', action: 'digit' },
  { id: '9', label: '9', action: 'digit' },
  { id: 'spacer', label: '', action: 'spacer' },
  { id: '0', label: '0', action: 'digit' },
  { id: 'del', label: 'Delete last digit', action: 'delete' },
];

interface AdminPinPromptProps {
  title: string;
  onVerify: (pin: string) => Promise<{ valid: boolean }>;
  onSuccess: () => void;
  onClose: () => void;
}

export default function AdminPinPrompt({
  title,
  onVerify,
  onSuccess,
  onClose,
}: AdminPinPromptProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const reducedMotion = useReducedMotion();

  const triggerShake = useCallback(() => {
    if (reducedMotion) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  }, [reducedMotion]);

  const submitPin = useCallback(
    async (pin: string) => {
      if (submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        const { valid } = await onVerify(pin);
        if (valid) {
          onSuccess();
        } else {
          triggerShake();
          setError('Incorrect PIN');
          setDigits([]);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          setError('Too many attempts, try again later');
        } else {
          setError('Something went wrong');
        }
        triggerShake();
        setDigits([]);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, onVerify, onSuccess, triggerShake],
  );

  function pressDigit(d: string) {
    if (submitting) return;
    setError(null);
    setDigits((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = [...prev, d];
      if (next.length === PIN_LENGTH) {
        void submitPin(next.join(''));
      }
      return next;
    });
  }

  function pressDelete() {
    if (submitting) return;
    setDigits((prev) => prev.slice(0, -1));
    setError(null);
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-6">
        <div
          className={clsx('flex gap-3', shaking && 'shake')}
          aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`}
          aria-live="polite"
        >
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span
              key={`dot-${i}`}
              className={clsx(
                'h-4 w-4 rounded-full border-2 transition-colors',
                i < digits.length ? 'border-primary bg-primary' : 'border-muted bg-transparent',
              )}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="text-caption font-medium text-alert-urgent">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3" role="group" aria-label="PIN keypad">
          {KEYPAD.map((key) => {
            if (key.action === 'spacer') {
              return <span key={key.id} aria-hidden="true" />;
            }
            if (key.action === 'delete') {
              return (
                <button
                  key={key.id}
                  type="button"
                  aria-label={key.label}
                  onClick={pressDelete}
                  disabled={submitting || digits.length === 0}
                  className="flex h-14 w-14 items-center justify-center rounded-button bg-surface-elev text-primary transition-opacity disabled:opacity-40 active:scale-95"
                >
                  <Delete size={20} />
                </button>
              );
            }
            return (
              <button
                key={key.id}
                type="button"
                aria-label={key.label}
                onClick={() => pressDigit(key.label)}
                disabled={submitting}
                className="flex h-14 w-14 items-center justify-center rounded-button bg-surface-elev text-h2 font-semibold text-primary transition-opacity disabled:opacity-40 active:scale-95"
              >
                {key.label}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
