import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { createMeterReading } from '../api';
import type { FuelType } from '../types';

const UNIT_DEFAULTS: Record<FuelType, string> = {
  electricity: 'kWh',
  gas: 'm3',
  oil: 'L',
  water: 'm3',
};

interface MeterReadingFormProps {
  open: boolean;
  defaultFuelType: FuelType;
  onClose: () => void;
}

export default function MeterReadingForm({
  open,
  defaultFuelType,
  onClose,
}: MeterReadingFormProps) {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createMeterReading,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meter-readings'] });
      onClose();
    },
  });

  const [fuelType, setFuelType] = useState<FuelType>(defaultFuelType);
  const [readingDate, setReadingDate] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(UNIT_DEFAULTS[defaultFuelType]);
  const [costPerUnit, setCostPerUnit] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setFuelType(defaultFuelType);
      setUnit(UNIT_DEFAULTS[defaultFuelType]);
      setReadingDate(new Date().toISOString().slice(0, 10));
      setValue('');
      setCostPerUnit('');
      setNotes('');
    }
  }, [open, defaultFuelType]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      fuel_type: fuelType,
      reading_date: new Date(readingDate).getTime(),
      value: parseFloat(value),
      unit,
      cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : null,
      notes: notes || null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Meter Reading">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Fuel type</label>
          <select
            value={fuelType}
            onChange={(e) => {
              const ft = e.target.value as FuelType;
              setFuelType(ft);
              setUnit(UNIT_DEFAULTS[ft]);
            }}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            <option value="electricity">Electricity</option>
            <option value="gas">Gas</option>
            <option value="oil">Oil</option>
            <option value="water">Water</option>
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Date</label>
          <input
            type="date"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Reading value
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Cost per unit (pence, optional)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Add Reading
          </Button>
        </div>
      </form>
    </Modal>
  );
}
