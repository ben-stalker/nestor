import { useState, useEffect, useMemo } from 'react';
import type { VehicleBooking, BookingConflict } from './types';

function toDatetimeLocal(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(val: string): number {
  return new Date(val).getTime();
}

function nowRoundedUp(): Date {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
  return d;
}

export interface BookingFormValues {
  start_datetime: number;
  end_datetime: number;
  notes: string | null;
}

interface Props {
  vehicleId: number;
  booking?: VehicleBooking | null;
  existingBookings?: VehicleBooking[];
  submitting?: boolean;
  onSubmit: (values: BookingFormValues) => void;
  onClose: () => void;
}

export default function BookingModal({
  booking,
  existingBookings = [],
  submitting = false,
  onSubmit,
  onClose,
}: Props) {
  const isEdit = Boolean(booking);

  const start0 = booking ? booking.start_datetime : nowRoundedUp().getTime();
  const end0 = booking ? booking.end_datetime : start0 + 8 * 3_600_000;

  const [startVal, setStartVal] = useState(toDatetimeLocal(start0));
  const [endVal, setEndVal] = useState(toDatetimeLocal(end0));
  const [notes, setNotes] = useState(booking?.notes ?? '');

  useEffect(() => {
    if (!booking) return;
    setStartVal(toDatetimeLocal(booking.start_datetime));
    setEndVal(toDatetimeLocal(booking.end_datetime));
    setNotes(booking.notes ?? '');
  }, [booking]);

  const startMs = fromDatetimeLocal(startVal);
  const endMs = fromDatetimeLocal(endVal);

  const conflicts = useMemo<BookingConflict[]>(() => {
    if (startMs >= endMs) return [];
    return existingBookings
      .filter((b) => {
        if (isEdit && booking && b.id === booking.id) return false;
        return b.start_datetime < endMs && b.end_datetime > startMs;
      })
      .map((b) => ({
        id: b.id,
        start_datetime: b.start_datetime,
        end_datetime: b.end_datetime,
        profile_id: b.profile_id,
      }));
  }, [existingBookings, startMs, endMs, isEdit, booking]);

  const hasConflict = conflicts.length > 0;
  const invalid = !startVal || !endVal || startMs >= endMs;

  function submitLabel(): string {
    if (submitting) return 'Saving…';
    if (isEdit) return 'Update';
    return 'Book';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid || hasConflict || submitting) return;
    onSubmit({ start_datetime: startMs, end_datetime: endMs, notes: notes || null });
  }

  const inputCls =
    'w-full rounded-lg border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent';
  const labelCls = 'block text-sm font-medium text-secondary mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit booking' : 'New booking'}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-card sm:rounded-card bg-surface p-6 shadow-xl">
        <h2 className="text-h2 font-semibold text-primary mb-4">
          {isEdit ? 'Edit booking' : 'Book vehicle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bm-start" className={labelCls}>
              Start
            </label>
            <input
              id="bm-start"
              type="datetime-local"
              className={inputCls}
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="bm-end" className={labelCls}>
              End
            </label>
            <input
              id="bm-end"
              type="datetime-local"
              className={inputCls}
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              required
            />
          </div>

          {startMs >= endMs && startVal && endVal && (
            <p className="text-sm text-red-600" role="alert">
              End must be after start
            </p>
          )}

          <div>
            <label htmlFor="bm-notes" className={labelCls}>
              Notes
            </label>
            <input
              id="bm-notes"
              className={inputCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Optional"
            />
          </div>

          {hasConflict && (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
              role="alert"
              aria-label="Booking conflict"
            >
              <p className="font-medium mb-1">
                Conflicts with existing booking{conflicts.length > 1 ? 's' : ''}:
              </p>
              <ul className="space-y-0.5">
                {conflicts.map((c) => (
                  <li key={c.id}>
                    {new Date(c.start_datetime).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                    {' – '}
                    {new Date(c.end_datetime).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </li>
                ))}
              </ul>
              <p className="mt-1">Change the times to resolve the conflict.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-button border border-surface-elev py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invalid || hasConflict || submitting}
              className="flex-1 rounded-button bg-accent py-2 text-body font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
