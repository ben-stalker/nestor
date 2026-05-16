import { useState } from 'react';
import { Modal, Button } from '../../shared/ui';
import type { PetHealthLog, PetHealthLogInput, PetLogType } from '../types';
import { PET_LOG_TYPES, LOG_TYPE_LABELS } from '../types';

interface HealthLogFormModalProps {
  open: boolean;
  petId: number;
  log?: PetHealthLog | null;
  onClose: () => void;
  onSave: (data: PetHealthLogInput) => void;
  isSaving?: boolean;
}

const today = () => new Date().toISOString().split('T')[0];

export default function HealthLogFormModal({
  open,
  log,
  onClose,
  onSave,
  isSaving,
}: HealthLogFormModalProps) {
  const [logType, setLogType] = useState<PetLogType>(log?.log_type ?? 'other');
  const [title, setTitle] = useState(log?.title ?? '');
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [logDate, setLogDate] = useState(log?.log_date ?? today());
  const [nextDueDate, setNextDueDate] = useState(log?.next_due_date ?? '');
  const [reminderDays, setReminderDays] = useState(String(log?.reminder_days_before ?? 7));
  const [weightKg, setWeightKg] = useState(log?.weight_kg != null ? String(log.weight_kg) : '');
  const [vetAppointmentDate, setVetAppointmentDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !logDate) return;
    onSave({
      log_type: logType,
      title: title.trim(),
      notes: notes.trim() || null,
      log_date: logDate,
      next_due_date: nextDueDate || null,
      reminder_days_before: reminderDays ? Number(reminderDays) : null,
      weight_kg: logType === 'weight' && weightKg ? Number(weightKg) : null,
      vet_appointment_date: logType === 'vet_visit' && vetAppointmentDate ? vetAppointmentDate : null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={log ? 'Edit Health Log Entry' : 'Add Health Log Entry'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="log-type">
            Type
          </label>
          <select
            id="log-type"
            value={logType}
            onChange={(e) => setLogType(e.target.value as PetLogType)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            {PET_LOG_TYPES.map((t) => (
              <option key={t} value={t}>
                {LOG_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="log-title">
            Title *
          </label>
          <input
            id="log-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="log-date">
            Date *
          </label>
          <input
            id="log-date"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            required
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        {logType === 'weight' && (
          <div>
            <label className="block text-caption text-secondary mb-1" htmlFor="weight-kg">
              Weight (kg)
            </label>
            <input
              id="weight-kg"
              type="number"
              step="0.01"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
            />
          </div>
        )}

        {logType === 'vet_visit' && !log && (
          <div>
            <label className="block text-caption text-secondary mb-1" htmlFor="vet-appt-date">
              Appointment date (adds to calendar)
            </label>
            <input
              id="vet-appt-date"
              type="date"
              value={vetAppointmentDate}
              onChange={(e) => setVetAppointmentDate(e.target.value)}
              className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="next-due">
            Next due date
          </label>
          <input
            id="next-due"
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        {nextDueDate && (
          <div>
            <label className="block text-caption text-secondary mb-1" htmlFor="reminder-days">
              Remind days before
            </label>
            <input
              id="reminder-days"
              type="number"
              min="0"
              max="365"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="log-notes">
            Notes
          </label>
          <textarea
            id="log-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !title.trim()}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
