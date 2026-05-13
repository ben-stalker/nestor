import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2 } from 'lucide-react';
import type { CalendarEventRaw } from '../api/calendar';
import { useProfiles } from '../core/hooks/useProfiles';
import useAppStore from '../store/appStore';
import RecurrencePicker from './RecurrencePicker';
import { createEvent, updateEvent, deleteEvent } from './api';

const EVENT_TYPES = [
  { value: 'default', label: 'Event' },
  { value: 'wfh', label: 'Work from home' },
  { value: 'shift', label: 'Shift' },
  { value: 'vehicle_booking', label: 'Vehicle booking' },
  { value: 'vet', label: 'Vet appointment' },
  { value: 'custody', label: 'Custody' },
];

function toDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): number {
  return new Date(s).getTime();
}

function toDateLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateLocal(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export type EventModalMode = 'create' | 'edit' | 'view';

interface EventModalProps {
  mode: EventModalMode;
  event?: CalendarEventRaw;
  defaultDate?: Date;
  defaultProfileId?: number | null;
  defaultType?: string;
  onClose: () => void;
}

interface FormState {
  title: string;
  allDay: boolean;
  startDatetime: string;
  endDatetime: string;
  startDate: string;
  endDate: string;
  profileId: string;
  type: string;
  recurringRule: string | undefined;
  colourOverride: string;
  notes: string;
}

function initForm(
  mode: EventModalMode,
  event?: CalendarEventRaw,
  defaultDate?: Date,
  defaultProfileId?: number | null,
  defaultType?: string,
): FormState {
  if ((mode === 'edit' || mode === 'view') && event) {
    return {
      title: event.title,
      allDay: event.all_day !== 0,
      startDatetime: toDatetimeLocal(event.start_datetime),
      endDatetime: toDatetimeLocal(event.end_datetime),
      startDate: toDateLocal(event.start_datetime),
      endDate: toDateLocal(event.end_datetime),
      profileId: event.profile_id !== null ? String(event.profile_id) : '',
      type: event.type,
      recurringRule: event.recurring_rule ?? undefined,
      colourOverride: event.colour_override ?? '',
      notes: event.notes ?? '',
    };
  }

  const base = defaultDate ?? new Date();
  const start = new Date(base);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60_000);

  return {
    title: '',
    allDay: false,
    startDatetime: toDatetimeLocal(start.getTime()),
    endDatetime: toDatetimeLocal(end.getTime()),
    startDate: toDateLocal(start.getTime()),
    endDate: toDateLocal(end.getTime()),
    profileId: defaultProfileId != null ? String(defaultProfileId) : '',
    type: defaultType ?? 'default',
    recurringRule: undefined,
    colourOverride: '',
    notes: '',
  };
}

export default function EventModal({
  mode,
  event,
  defaultDate,
  defaultProfileId,
  defaultType,
  onClose,
}: EventModalProps) {
  const activeProfileIdStr = useAppStore(
    (s: { activeProfileId: string | null }) => s.activeProfileId,
  );
  const activeProfileId = activeProfileIdStr ? parseInt(activeProfileIdStr, 10) : null;
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() =>
    initForm(mode, event, defaultDate, defaultProfileId, defaultType),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentMode, setCurrentMode] = useState<EventModalMode>(mode);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isAdmin = activeProfile?.type === 'admin';
  const isReadOnly =
    currentMode === 'view' || (currentMode !== 'create' && event?.source !== 'local' && !isAdmin);

  function invalidateEvents() {
    void qc.invalidateQueries({ queryKey: ['events'] });
  }

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      invalidateEvents();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateEvent>[1] }) =>
      updateEvent(id, input),
    onSuccess: () => {
      invalidateEvents();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      invalidateEvents();
      onClose();
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.allDay) {
      const s = fromDatetimeLocal(form.startDatetime);
      const e = fromDatetimeLocal(form.endDatetime);
      if (e <= s) newErrors.endDatetime = 'End must be after start';
    } else {
      const s = fromDateLocal(form.startDate);
      const e = fromDateLocal(form.endDate);
      if (e < s) newErrors.endDate = 'End date must be on or after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const startMs = form.allDay
      ? fromDateLocal(form.startDate)
      : fromDatetimeLocal(form.startDatetime);
    const endMs = form.allDay ? fromDateLocal(form.endDate) : fromDatetimeLocal(form.endDatetime);

    const payload = {
      title: form.title.trim(),
      start_datetime: startMs,
      end_datetime: endMs,
      all_day: form.allDay,
      profile_id: form.profileId ? parseInt(form.profileId, 10) : null,
      type: form.type,
      recurring_rule: form.recurringRule ?? null,
      colour_override: form.colourOverride || null,
      notes: form.notes.trim() || null,
    };

    if (currentMode === 'create') {
      createMutation.mutate(payload);
    } else if (currentMode === 'edit' && event) {
      updateMutation.mutate({ id: event.id, input: payload });
    }
  }

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const calDAVBanner =
    event?.source !== 'local' && !isAdmin ? (
      <div className="event-modal__caldav-banner">Synced from {event?.source} — read only</div>
    ) : null;

  const startDate = form.allDay
    ? fromDateLocal(form.startDate)
    : fromDatetimeLocal(form.startDatetime);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={currentMode === 'create' ? 'New event' : form.title || 'Event'}
        className="event-modal"
      >
        <div className="event-modal__header">
          <h2 className="event-modal__title">
            {currentMode === 'create' && 'New event'}
            {currentMode === 'edit' && 'Edit event'}
            {currentMode === 'view' && form.title}
          </h2>
          <div className="event-modal__header-actions">
            {currentMode === 'view' && event?.source === 'local' && (
              <button
                type="button"
                className="event-modal__edit-btn"
                onClick={() => setCurrentMode('edit')}
                aria-label="Edit event"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              className="event-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {calDAVBanner}

        <div className="event-modal__body">
          {/* Title */}
          <div className="event-modal__field">
            <label className="event-modal__label" htmlFor="event-title">
              Title
            </label>
            <input
              id="event-title"
              type="text"
              className={`event-modal__input${errors.title ? ' event-modal__input--error' : ''}`}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              readOnly={isReadOnly}
              placeholder="Event title"
              autoFocus={currentMode !== 'view'}
            />
            {errors.title && <span className="event-modal__error">{errors.title}</span>}
          </div>

          {/* All-day toggle */}
          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__label" htmlFor="event-allday">
              All day
            </label>
            <input
              id="event-allday"
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update('allDay', e.target.checked)}
              disabled={isReadOnly}
              className="event-modal__checkbox"
            />
          </div>

          {/* Start */}
          <div className="event-modal__field">
            <label className="event-modal__label" htmlFor="event-start">
              Start
            </label>
            {form.allDay ? (
              <input
                id="event-start"
                type="date"
                className="event-modal__input"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                readOnly={isReadOnly}
              />
            ) : (
              <input
                id="event-start"
                type="datetime-local"
                className="event-modal__input"
                value={form.startDatetime}
                onChange={(e) => update('startDatetime', e.target.value)}
                readOnly={isReadOnly}
              />
            )}
          </div>

          {/* End */}
          <div className="event-modal__field">
            <label className="event-modal__label" htmlFor="event-end">
              End
            </label>
            {form.allDay ? (
              <>
                <input
                  id="event-end"
                  type="date"
                  className={`event-modal__input${errors.endDate ? ' event-modal__input--error' : ''}`}
                  value={form.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                  readOnly={isReadOnly}
                />
                {errors.endDate && <span className="event-modal__error">{errors.endDate}</span>}
              </>
            ) : (
              <>
                <input
                  id="event-end"
                  type="datetime-local"
                  className={`event-modal__input${errors.endDatetime ? ' event-modal__input--error' : ''}`}
                  value={form.endDatetime}
                  onChange={(e) => update('endDatetime', e.target.value)}
                  readOnly={isReadOnly}
                />
                {errors.endDatetime && (
                  <span className="event-modal__error">{errors.endDatetime}</span>
                )}
              </>
            )}
          </div>

          {/* Profile */}
          <div className="event-modal__field">
            <label className="event-modal__label" htmlFor="event-profile">
              Profile
            </label>
            <div className="event-modal__profile-pills">
              <button
                type="button"
                className={`event-modal__profile-pill${form.profileId === '' ? ' event-modal__profile-pill--active' : ''}`}
                onClick={() => !isReadOnly && update('profileId', '')}
                disabled={isReadOnly}
              >
                All
              </button>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`event-modal__profile-pill${form.profileId === String(p.id) ? ' event-modal__profile-pill--active' : ''}`}
                  style={{
                    borderColor: p.colour,
                    ...(form.profileId === String(p.id)
                      ? { backgroundColor: p.colour, color: '#fff' }
                      : {}),
                  }}
                  onClick={() => !isReadOnly && update('profileId', String(p.id))}
                  disabled={isReadOnly}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="event-modal__field">
            <label className="event-modal__label" htmlFor="event-type">
              Type
            </label>
            <select
              id="event-type"
              className="event-modal__select"
              value={form.type}
              onChange={(e) => update('type', e.target.value)}
              disabled={isReadOnly}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recurrence */}
          {!form.allDay && (
            <div className="event-modal__field">
              <label className="event-modal__label">Repeat</label>
              {isReadOnly ? (
                <span className="event-modal__static">
                  {form.recurringRule ?? 'Does not repeat'}
                </span>
              ) : (
                <RecurrencePicker
                  value={form.recurringRule}
                  startDate={new Date(startDate)}
                  onChange={(v) => update('recurringRule', v)}
                />
              )}
            </div>
          )}

          {/* Colour override */}
          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__label" htmlFor="event-colour">
              Colour
            </label>
            <input
              id="event-colour"
              type="color"
              className="event-modal__colour-input"
              value={form.colourOverride || '#4a90d9'}
              onChange={(e) => update('colourOverride', e.target.value)}
              disabled={isReadOnly}
            />
            {form.colourOverride && !isReadOnly && (
              <button
                type="button"
                className="event-modal__colour-clear"
                onClick={() => update('colourOverride', '')}
                aria-label="Clear colour override"
              >
                ×
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="event-modal__field">
            <label className="event-modal__label" htmlFor="event-notes">
              Notes
            </label>
            <textarea
              id="event-notes"
              className="event-modal__textarea"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              readOnly={isReadOnly}
              rows={3}
              placeholder="Optional notes…"
            />
          </div>
        </div>

        <div className="event-modal__footer">
          {confirmDelete ? (
            <div className="event-modal__confirm-delete">
              <span>Delete this event?</span>
              <button
                type="button"
                className="event-modal__btn event-modal__btn--danger"
                onClick={() => event && deleteMutation.mutate(event.id)}
                disabled={isPending}
              >
                Delete
              </button>
              <button
                type="button"
                className="event-modal__btn event-modal__btn--secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {currentMode === 'edit' && event?.source === 'local' && (
                <button
                  type="button"
                  className="event-modal__btn event-modal__btn--icon"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete event"
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                className="event-modal__btn event-modal__btn--secondary"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  className="event-modal__btn event-modal__btn--primary"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending ? 'Saving…' : 'Save'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
