import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { createSubscription, updateSubscription } from '../api';
import type { Subscription } from '../types';

interface SubscriptionFormProps {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
}

export default function SubscriptionForm({ open, subscription, onClose }: SubscriptionFormProps) {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['subscriptions'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: object }) => updateSubscription(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['subscriptions'] });
      onClose();
    },
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Subscription['category']>('other');
  const [monthlyCost, setMonthlyCost] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [trialEndDate, setTrialEndDate] = useState('');
  const [alertDaysBefore, setAlertDaysBefore] = useState('7');

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setCategory(subscription.category);
      setMonthlyCost(String(subscription.monthly_cost / 100));
      setRenewalDate(new Date(subscription.renewal_date).toISOString().slice(0, 10));
      setTrialEndDate(
        subscription.trial_end_date
          ? new Date(subscription.trial_end_date).toISOString().slice(0, 10)
          : '',
      );
      setAlertDaysBefore(String(subscription.alert_days_before));
    } else {
      setName('');
      setCategory('other');
      setMonthlyCost('');
      setRenewalDate('');
      setTrialEndDate('');
      setAlertDaysBefore('7');
    }
  }, [subscription, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      category,
      monthly_cost: Math.round(parseFloat(monthlyCost) * 100),
      renewal_date: new Date(renewalDate).getTime(),
      trial_end_date: trialEndDate ? new Date(trialEndDate).getTime() : null,
      alert_days_before: Number(alertDaysBefore),
    };
    if (subscription) {
      updateMutation.mutate({ id: subscription.id, patch: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subscription ? 'Edit Subscription' : 'Add Subscription'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Subscription['category'])}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            <option value="streaming">Streaming</option>
            <option value="software">Software</option>
            <option value="services">Services</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Monthly cost (£)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Renewal date</label>
          <input
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Trial end date (optional)
          </label>
          <input
            type="date"
            value={trialEndDate}
            onChange={(e) => setTrialEndDate(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">
            Alert days before renewal
          </label>
          <input
            type="number"
            min="1"
            value={alertDaysBefore}
            onChange={(e) => setAlertDaysBefore(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {subscription ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
