import { useState } from 'react';
import { Settings, History } from 'lucide-react';
import Button from '../shared/ui/Button';
import Skeleton from '../shared/ui/Skeleton';
import { useFuelRates, useUpdateFuelRates } from './hooks/useEnergyOverview';
import useAppStore from '../store/appStore';

const FUEL_LABELS: Record<string, string> = {
  electricity: 'Electricity (p/kWh)',
  gas: 'Gas (p/kWh)',
  oil: 'Oil (p/litre)',
};

export default function FuelRatesPanel() {
  const adminPin = useAppStore((s) => s.adminPin);
  const { data, isLoading } = useFuelRates();
  const updateRates = useUpdateFuelRates();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ electricity: '', gas: '', oil: '' });
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  function handleEdit() {
    if (!data) return;
    const c = data.current;
    setForm({
      electricity: c.electricity != null ? String(c.electricity) : '',
      gas: c.gas != null ? String(c.gas) : '',
      oil: c.oil != null ? String(c.oil) : '',
    });
    setEditing(true);
    setError('');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminPin) return;

    const rates: { electricity?: number; gas?: number; oil?: number } = {};
    if (form.electricity !== '') rates.electricity = parseFloat(form.electricity);
    if (form.gas !== '') rates.gas = parseFloat(form.gas);
    if (form.oil !== '') rates.oil = parseFloat(form.oil);

    if (Object.keys(rates).length === 0) {
      setError('Enter at least one rate');
      return;
    }

    updateRates.mutate(
      { rates, effectiveDate, adminPin },
      {
        onSuccess: () => setEditing(false),
        onError: () => setError('Failed to save rates'),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-card" />
        ))}
      </div>
    );
  }

  const current = data?.current ?? {};
  const history = data?.history ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-secondary">
          <Settings size={18} />
          <span className="text-body font-semibold">Current Rates</span>
        </div>
        {adminPin && !editing && (
          <Button size="sm" variant="secondary" onClick={handleEdit}>
            Edit Rates
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3 p-4 rounded-card bg-surface border border-neutral-200">
          {(['electricity', 'gas', 'oil'] as const).map((fuel) => (
            <div key={fuel}>
              <label className="block text-caption text-secondary mb-1">{FUEL_LABELS[fuel]}</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder={current[fuel] != null ? String(current[fuel]) : '—'}
                className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-white"
                value={form[fuel]}
                onChange={(e) => setForm((f) => ({ ...f, [fuel]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="block text-caption text-secondary mb-1">Effective date</label>
            <input
              type="date"
              className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-white"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          {error && <p className="text-caption text-urgent">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" size="sm" loading={updateRates.isPending}>
              Save
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {(['electricity', 'gas', 'oil'] as const).map((fuel) => (
            <div
              key={fuel}
              className="flex items-center justify-between p-3 rounded-card bg-surface border border-neutral-100"
            >
              <span className="text-body">{FUEL_LABELS[fuel]}</span>
              <span className="text-body font-medium">
                {current[fuel] != null ? `${current[fuel]}p` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-secondary mt-4">
            <History size={16} />
            <span className="text-caption font-semibold uppercase tracking-wide">Rate History</span>
          </div>
          <div className="space-y-1">
            {history.slice(0, 10).map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-caption text-secondary py-1.5 border-b border-neutral-100 last:border-0"
              >
                <span>
                  {FUEL_LABELS[entry.fuel] ?? entry.fuel} — {entry.rate}p
                </span>
                <span>{new Date(entry.effective_date).toLocaleDateString('en-GB')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
