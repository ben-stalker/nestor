import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../../shared/ui';
import { createAgreement, updateAgreement } from '../api';
import type { FinanceAgreement, AgreementType } from '../types';

interface Props {
  open: boolean;
  agreement: FinanceAgreement | null;
  onClose: () => void;
}

const TYPES: Array<{ value: AgreementType; label: string }> = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'pcp', label: 'PCP (Vehicle Finance)' },
  { value: 'loan', label: 'Loan' },
  { value: 'bnpl', label: 'Buy Now Pay Later' },
  { value: 'insurance', label: 'Insurance' },
];

function toDateInput(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toISOString().split('T')[0];
}

function fromDateInput(s: string): number | null {
  if (!s) return null;
  return new Date(s).getTime();
}

function poundsToMinor(s: string): number {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

function minorToPounds(minor: number | null | undefined): string {
  if (minor == null) return '';
  return (minor / 100).toFixed(2);
}

export default function AgreementForm({ open, agreement, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!agreement;

  const [name, setName] = useState('');
  const [type, setType] = useState<AgreementType>('mortgage');
  const [lender, setLender] = useState('');
  const [monthly, setMonthly] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [fixedRateEnd, setFixedRateEnd] = useState('');
  const [balloon, setBalloon] = useState('');
  const [alertMonths, setAlertMonths] = useState('3');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (agreement) {
        setName(agreement.name);
        setType(agreement.type);
        setLender(agreement.lender ?? '');
        setMonthly(minorToPounds(agreement.monthly_payment_minor));
        setStartDate(toDateInput(agreement.start_date));
        setEndDate(toDateInput(agreement.end_date));
        setBalance(minorToPounds(agreement.balance_minor));
        setRate(agreement.interest_rate != null ? String(agreement.interest_rate) : '');
        setFixedRateEnd(toDateInput(agreement.fixed_rate_end_date));
        setBalloon(minorToPounds(agreement.balloon_payment_minor));
        setAlertMonths(String(agreement.alert_months_before));
        setNotes(agreement.notes ?? '');
      } else {
        setName('');
        setType('mortgage');
        setLender('');
        setMonthly('');
        setStartDate('');
        setEndDate('');
        setBalance('');
        setRate('');
        setFixedRateEnd('');
        setBalloon('');
        setAlertMonths('3');
        setNotes('');
      }
      setError('');
    }
  }, [open, agreement]);

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      isEdit ? updateAgreement(agreement.id, payload) : createAgreement(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance-agreements'] });
      void qc.invalidateQueries({ queryKey: ['finance-summary'] });
      onClose();
    },
    onError: () => setError('Failed to save. Please try again.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !monthly || !startDate) {
      setError('Name, monthly payment, and start date are required.');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      type,
      lender: lender.trim() || null,
      monthly_payment_minor: poundsToMinor(monthly),
      start_date: fromDateInput(startDate),
      end_date: fromDateInput(endDate),
      balance_minor: balance ? poundsToMinor(balance) : null,
      interest_rate: rate ? parseFloat(rate) : null,
      fixed_rate_end_date: fromDateInput(fixedRateEnd),
      balloon_payment_minor: balloon ? poundsToMinor(balloon) : null,
      alert_months_before: parseInt(alertMonths, 10) || 3,
      currency: 'GBP',
      notes: notes.trim() || null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Agreement' : 'Add Agreement'}>
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label className="block text-caption font-medium text-primary mb-1">Name *</label>
          <input
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Home Mortgage"
            required
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-primary mb-1">Type *</label>
          <select
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={type}
            onChange={(e) => setType(e.target.value as AgreementType)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-primary mb-1">Lender</label>
          <input
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={lender}
            onChange={(e) => setLender(e.target.value)}
            placeholder="e.g. Halifax"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-medium text-primary mb-1">
              Monthly (£) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-primary mb-1">Balance (£)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-medium text-primary mb-1">Start date *</label>
            <input
              type="date"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-primary mb-1">End date</label>
            <input
              type="date"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-medium text-primary mb-1">
              Interest rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 4.5"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-primary mb-1">
              Alert (months before end)
            </label>
            <input
              type="number"
              min="1"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={alertMonths}
              onChange={(e) => setAlertMonths(e.target.value)}
            />
          </div>
        </div>

        {type === 'mortgage' && (
          <div>
            <label className="block text-caption font-medium text-primary mb-1">
              Fixed rate end date
            </label>
            <input
              type="date"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={fixedRateEnd}
              onChange={(e) => setFixedRateEnd(e.target.value)}
            />
          </div>
        )}

        {type === 'pcp' && (
          <div>
            <label className="block text-caption font-medium text-primary mb-1">
              Balloon payment (£)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={balloon}
              onChange={(e) => setBalloon(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        <div>
          <label className="block text-caption font-medium text-primary mb-1">Notes</label>
          <textarea
            rows={2}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-caption text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saveMutation.isPending}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
