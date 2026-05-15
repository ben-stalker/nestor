import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHealthLog } from './api';
import type { HealthLogType } from './types';

interface Props {
  profileId: number;
  onClose: () => void;
}

const LOG_TYPES: { value: HealthLogType; label: string }[] = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'symptom', label: 'Symptom' },
  { value: 'vaccination', label: 'Vaccination' },
];

export default function HealthLogAddModal({ profileId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [logType, setLogType] = useState<HealthLogType>('medicine');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: object) => createHealthLog(profileId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['health-log', profileId] });
      onClose();
    },
    onError: () => setError('Failed to save entry. Please try again.'),
  });

  const field = (key: string, label: string, type = 'text', required = true) => (
    <div key={key} className="health-modal__field">
      <label htmlFor={`health-${key}`} className="health-modal__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={`health-${key}`}
        type={type}
        className="health-modal__input"
        value={fields[key] ?? ''}
        required={required}
        onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let data: Record<string, unknown> = { log_type: logType };
    switch (logType) {
      case 'medicine':
        data = { log_type: logType, name: fields.name, dose: fields.dose, reason: fields.reason };
        break;
      case 'temperature':
        data = { log_type: logType, value: Number(fields.value), unit: fields.unit || 'c' };
        break;
      case 'symptom':
        data = { log_type: logType, text: fields.text };
        break;
      case 'vaccination':
        data = { log_type: logType, name: fields.name, lot_number: fields.lot_number };
        break;
      default:
        break;
    }
    mutation.mutate(data);
  };

  return (
    <div className="health-modal" role="dialog" aria-label="Add health log entry" aria-modal="true">
      <div className="health-modal__content">
        <div className="health-modal__header">
          <h2 className="health-modal__title">Add health entry</h2>
          <button
            type="button"
            className="health-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form className="health-modal__form" onSubmit={handleSubmit}>
          <div className="health-modal__field">
            <label htmlFor="health-log-type" className="health-modal__label">
              Type
            </label>
            <select
              id="health-log-type"
              className="health-modal__select"
              value={logType}
              onChange={(e) => {
                setLogType(e.target.value as HealthLogType);
                setFields({});
              }}
            >
              {LOG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {logType === 'medicine' && (
            <>
              {field('name', 'Medicine name')}
              {field('dose', 'Dose (e.g. 5ml)')}
              {field('reason', 'Reason', 'text', false)}
            </>
          )}

          {logType === 'temperature' && (
            <>
              {field('value', 'Temperature', 'number')}
              <div className="health-modal__field">
                <label htmlFor="health-unit" className="health-modal__label">
                  Unit
                </label>
                <select
                  id="health-unit"
                  className="health-modal__select"
                  value={fields.unit ?? 'c'}
                  onChange={(e) => setFields((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="c">Celsius (°C)</option>
                  <option value="f">Fahrenheit (°F)</option>
                </select>
              </div>
            </>
          )}

          {logType === 'symptom' && field('text', 'Description')}

          {logType === 'vaccination' && (
            <>
              {field('name', 'Vaccine name')}
              {field('lot_number', 'Lot number', 'text', false)}
            </>
          )}

          {error && (
            <p className="health-modal__error" role="alert">
              {error}
            </p>
          )}

          <div className="health-modal__actions">
            <button type="button" className="health-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="health-modal__submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
