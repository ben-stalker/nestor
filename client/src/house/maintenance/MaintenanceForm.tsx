import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { createMaintenanceItem, updateMaintenanceItem } from '../api';
import type { HomeMaintenance } from '../types';

interface MaintenanceFormProps {
  open: boolean;
  item: HomeMaintenance | null;
  onClose: () => void;
}

export default function MaintenanceForm({ open, item, onClose }: MaintenanceFormProps) {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createMaintenanceItem,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: object }) => updateMaintenanceItem(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance'] });
      onClose();
    },
  });

  const [title, setTitle] = useState('');
  const [type, setType] = useState<HomeMaintenance['type']>('job');
  const [nextDueDate, setNextDueDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [cost, setCost] = useState('');
  const [landlordReport, setLandlordReport] = useState(false);
  const [renterMode, setRenterMode] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setType(item.type);
      setNextDueDate(
        item.next_due_date ? new Date(item.next_due_date).toISOString().slice(0, 10) : '',
      );
      setCompletedDate(
        item.completed_date ? new Date(item.completed_date).toISOString().slice(0, 10) : '',
      );
      setCost(item.cost !== null ? String(item.cost / 100) : '');
      setLandlordReport(item.landlord_report);
      setRenterMode(item.renter_mode);
      setNotes(item.notes ?? '');
    } else {
      setTitle('');
      setType('job');
      setNextDueDate('');
      setCompletedDate('');
      setCost('');
      setLandlordReport(false);
      setRenterMode(false);
      setNotes('');
    }
  }, [item, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      type,
      next_due_date: nextDueDate ? new Date(nextDueDate).getTime() : null,
      completed_date: completedDate ? new Date(completedDate).getTime() : null,
      cost: cost ? Math.round(parseFloat(cost) * 100) : null,
      landlord_report: landlordReport,
      renter_mode: renterMode,
      notes: notes || null,
    };
    if (item) {
      updateMutation.mutate({ id: item.id, patch: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Item' : 'Add Maintenance Item'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as HomeMaintenance['type'])}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            <option value="job">Job</option>
            <option value="warranty">Warranty</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Next due date
          </label>
          <input
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Completed date
          </label>
          <input
            type="date"
            value={completedDate}
            onChange={(e) => setCompletedDate(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Cost (£)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={renterMode}
              onChange={(e) => setRenterMode(e.target.checked)}
            />
            <span className="text-body text-primary">Renter mode</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={landlordReport}
              onChange={(e) => setLandlordReport(e.target.checked)}
            />
            <span className="text-body text-primary">Reported to landlord</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {item ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
