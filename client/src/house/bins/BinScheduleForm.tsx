import { useState, useEffect } from 'react';
import { Modal, Button } from '../../shared/ui';
import { useCreateBinSchedule, useUpdateBinSchedule } from '../hooks/useBinSchedules';
import type { BinSchedule } from '../types';

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const FREQ_OPTIONS = [
  { value: 1, label: 'Every week' },
  { value: 2, label: 'Every 2 weeks' },
  { value: 4, label: 'Every 4 weeks' },
];

interface BinScheduleFormProps {
  open: boolean;
  bin: BinSchedule | null;
  onClose: () => void;
}

export default function BinScheduleForm({ open, bin, onClose }: BinScheduleFormProps) {
  const createMutation = useCreateBinSchedule();
  const updateMutation = useUpdateBinSchedule();

  const [name, setName] = useState('');
  const [colour, setColour] = useState('#4CAF50');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [frequencyWeeks, setFrequencyWeeks] = useState<1 | 2 | 4>(1);
  const [anchorDate, setAnchorDate] = useState('');
  const [bankHolidayShift, setBankHolidayShift] = useState(true);
  const [reminderEveningBefore, setReminderEveningBefore] = useState(true);
  const [reminderMorningOf, setReminderMorningOf] = useState(false);

  useEffect(() => {
    if (bin) {
      setName(bin.name);
      setColour(bin.colour);
      setDayOfWeek(bin.day_of_week);
      setFrequencyWeeks(bin.frequency_weeks);
      setAnchorDate(new Date(bin.anchor_date).toISOString().slice(0, 10));
      setBankHolidayShift(bin.bank_holiday_shift);
      setReminderEveningBefore(bin.reminder_evening_before);
      setReminderMorningOf(bin.reminder_morning_of);
    } else {
      setName('');
      setColour('#4CAF50');
      setDayOfWeek(1);
      setFrequencyWeeks(1);
      setAnchorDate('');
      setBankHolidayShift(true);
      setReminderEveningBefore(true);
      setReminderMorningOf(false);
    }
  }, [bin, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anchorDate) return;

    const payload = {
      name,
      colour,
      icon: 'trash',
      day_of_week: dayOfWeek,
      frequency_weeks: frequencyWeeks,
      anchor_date: new Date(anchorDate).getTime(),
      bank_holiday_shift: bankHolidayShift,
      reminder_evening_before: reminderEveningBefore,
      reminder_morning_of: reminderMorningOf,
      audio_chime: false,
    };

    if (bin) {
      updateMutation.mutate({ id: bin.id, patch: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={bin ? 'Edit Bin Schedule' : 'Add Bin Schedule'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1" htmlFor="bin-name">
            Name
          </label>
          <input
            id="bin-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label
            className="block text-caption font-medium text-secondary mb-1"
            htmlFor="bin-colour"
          >
            Colour
          </label>
          <input
            id="bin-colour"
            type="color"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            className="h-10 w-full rounded-button border border-surface-elev bg-surface"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1" htmlFor="bin-day">
            Collection day
          </label>
          <select
            id="bin-day"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1" htmlFor="bin-freq">
            Frequency
          </label>
          <select
            id="bin-freq"
            value={frequencyWeeks}
            onChange={(e) => setFrequencyWeeks(Number(e.target.value) as 1 | 2 | 4)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            {FREQ_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-caption font-medium text-secondary mb-1"
            htmlFor="bin-anchor"
          >
            Known collection date (anchor)
          </label>
          <input
            id="bin-anchor"
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bankHolidayShift}
              onChange={(e) => setBankHolidayShift(e.target.checked)}
              className="rounded"
            />
            <span className="text-body text-primary">Shift forward on bank holidays</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reminderEveningBefore}
              onChange={(e) => setReminderEveningBefore(e.target.checked)}
              className="rounded"
            />
            <span className="text-body text-primary">Reminder evening before</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reminderMorningOf}
              onChange={(e) => setReminderMorningOf(e.target.checked)}
              className="rounded"
            />
            <span className="text-body text-primary">Reminder morning of collection</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {bin ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
