import { useState, useEffect } from 'react';
import type { Vehicle, VehicleType } from './types';

const VEHICLE_TYPES: VehicleType[] = ['car', 'van', 'motorcycle', 'bicycle', 'ev'];

function toDateInput(epochMs: number | null): string {
  if (epochMs === null) return '';
  return new Date(epochMs).toISOString().slice(0, 10);
}

function fromDateInput(val: string): number | null {
  if (!val) return null;
  return new Date(val).getTime();
}

export interface VehicleFormValues {
  nickname: string;
  type: VehicleType;
  make: string;
  model: string;
  year: string;
  registration: string;
  colour: string;
  mot_due: string;
  tax_due: string;
  insurance_due: string;
  service_due: string;
  service_due_mileage: string;
  current_mileage: string;
}

interface Props {
  vehicle?: Vehicle | null;
  onSubmit: (data: object) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function VehicleForm({ vehicle, onSubmit, onCancel, submitting = false }: Props) {
  const [values, setValues] = useState<VehicleFormValues>(() => ({
    nickname: vehicle?.nickname ?? '',
    type: vehicle?.type ?? 'car',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ? String(vehicle.year) : '',
    registration: vehicle?.registration ?? '',
    colour: vehicle?.colour ?? '',
    mot_due: toDateInput(vehicle?.mot_due ?? null),
    tax_due: toDateInput(vehicle?.tax_due ?? null),
    insurance_due: toDateInput(vehicle?.insurance_due ?? null),
    service_due: toDateInput(vehicle?.service_due ?? null),
    service_due_mileage: vehicle?.service_due_mileage ? String(vehicle.service_due_mileage) : '',
    current_mileage: vehicle?.current_mileage ? String(vehicle.current_mileage) : '',
  }));

  useEffect(() => {
    if (!vehicle) return;
    setValues({
      nickname: vehicle.nickname,
      type: vehicle.type,
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ? String(vehicle.year) : '',
      registration: vehicle.registration ?? '',
      colour: vehicle.colour ?? '',
      mot_due: toDateInput(vehicle.mot_due),
      tax_due: toDateInput(vehicle.tax_due),
      insurance_due: toDateInput(vehicle.insurance_due),
      service_due: toDateInput(vehicle.service_due),
      service_due_mileage: vehicle.service_due_mileage ? String(vehicle.service_due_mileage) : '',
      current_mileage: vehicle.current_mileage ? String(vehicle.current_mileage) : '',
    });
  }, [vehicle]);

  const showMot = values.type !== 'bicycle' && values.type !== 'ev';

  function handleChange(field: keyof VehicleFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function submitLabel(): string {
    if (submitting) return 'Saving…';
    return vehicle ? 'Update' : 'Add vehicle';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      nickname: values.nickname.trim(),
      type: values.type,
      make: values.make.trim() || null,
      model: values.model.trim() || null,
      year: values.year ? Number(values.year) : null,
      registration: values.registration.trim() || null,
      colour: values.colour.trim() || null,
      tax_due: fromDateInput(values.tax_due),
      insurance_due: fromDateInput(values.insurance_due),
      service_due: fromDateInput(values.service_due),
      service_due_mileage: values.service_due_mileage ? Number(values.service_due_mileage) : null,
      current_mileage: values.current_mileage ? Number(values.current_mileage) : null,
    };
    if (showMot) {
      payload.mot_due = fromDateInput(values.mot_due);
    } else {
      payload.mot_due = null;
    }
    onSubmit(payload);
  }

  const inputCls =
    'w-full rounded-lg border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent';
  const labelCls = 'block text-sm font-medium text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="vf-nickname" className={labelCls}>
          Nickname *
        </label>
        <input
          id="vf-nickname"
          className={inputCls}
          value={values.nickname}
          onChange={(e) => handleChange('nickname', e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="vf-type" className={labelCls}>
          Type *
        </label>
        <select
          id="vf-type"
          className={inputCls}
          value={values.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="vf-make" className={labelCls}>
            Make
          </label>
          <input
            id="vf-make"
            className={inputCls}
            value={values.make}
            onChange={(e) => handleChange('make', e.target.value)}
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="vf-model" className={labelCls}>
            Model
          </label>
          <input
            id="vf-model"
            className={inputCls}
            value={values.model}
            onChange={(e) => handleChange('model', e.target.value)}
            maxLength={100}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="vf-reg" className={labelCls}>
            Registration
          </label>
          <input
            id="vf-reg"
            className={inputCls}
            value={values.registration}
            onChange={(e) => handleChange('registration', e.target.value.toUpperCase())}
            maxLength={20}
          />
        </div>
        <div>
          <label htmlFor="vf-year" className={labelCls}>
            Year
          </label>
          <input
            id="vf-year"
            type="number"
            className={inputCls}
            value={values.year}
            onChange={(e) => handleChange('year', e.target.value)}
            min={1900}
            max={2100}
          />
        </div>
      </div>

      <p className="text-sm font-medium text-secondary mt-2">Renewal dates</p>

      <div className={`grid gap-3 ${showMot ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {showMot && (
          <div>
            <label htmlFor="vf-mot" className={labelCls}>
              MOT due
            </label>
            <input
              id="vf-mot"
              type="date"
              className={inputCls}
              value={values.mot_due}
              onChange={(e) => handleChange('mot_due', e.target.value)}
            />
          </div>
        )}
        <div>
          <label htmlFor="vf-tax" className={labelCls}>
            Tax due
          </label>
          <input
            id="vf-tax"
            type="date"
            className={inputCls}
            value={values.tax_due}
            onChange={(e) => handleChange('tax_due', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="vf-ins" className={labelCls}>
            Insurance due
          </label>
          <input
            id="vf-ins"
            type="date"
            className={inputCls}
            value={values.insurance_due}
            onChange={(e) => handleChange('insurance_due', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="vf-service" className={labelCls}>
            Service due
          </label>
          <input
            id="vf-service"
            type="date"
            className={inputCls}
            value={values.service_due}
            onChange={(e) => handleChange('service_due', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-button border border-surface-elev py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !values.nickname.trim()}
          className="flex-1 rounded-button bg-accent py-2 text-body font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitLabel()}
        </button>
      </div>
    </form>
  );
}
