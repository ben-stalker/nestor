import { Zap, Gauge, Flame, TrendingUp } from 'lucide-react';
import Skeleton from '../shared/ui/Skeleton';
import { useEnergySummary } from './hooks/useEnergyOverview';
import type { MonthlyEvSummary } from './types';

function pence(minor: number) {
  if (minor === 0) return '£0.00';
  return `£${(minor / 100).toFixed(2)}`;
}

function MonthBar({ entry, maxCost }: { entry: MonthlyEvSummary; maxCost: number }) {
  const height = maxCost > 0 ? Math.round((entry.total_cost_minor / maxCost) * 100) : 0;
  const label = new Date(entry.year, entry.month - 1).toLocaleString('default', {
    month: 'short',
  });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 flex flex-col justify-end" style={{ height: 80 }}>
        <div
          className="w-full rounded-sm bg-mode-ev/70"
          style={{ height: `${height}%`, minHeight: height > 0 ? 4 : 0 }}
        />
      </div>
      <span className="text-[10px] text-secondary">{label}</span>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`p-4 rounded-card bg-surface border border-neutral-100 flex gap-3 items-start`}>
      <div
        className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${accent ?? 'bg-neutral-100 text-secondary'}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-caption text-secondary">{label}</p>
        <p className="text-h2 font-semibold">{value}</p>
        {sub && <p className="text-caption text-secondary">{sub}</p>}
      </div>
    </div>
  );
}

export default function EnergyOverview() {
  const { data: summary, isLoading } = useEnergySummary();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const { this_month: tm, monthly_ev_history: history } = summary;
  const maxCost = Math.max(...history.map((h) => h.total_cost_minor), 1);
  const reversed = [...history].reverse();

  return (
    <div className="space-y-5">
      <h3 className="text-body font-semibold text-secondary uppercase tracking-wide text-xs">
        This Month
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Zap size={18} />}
          label="EV Charging"
          value={pence(tm.ev_cost_minor)}
          sub={`${tm.ev_kwh} kWh`}
          accent="bg-mode-ev/10 text-mode-ev"
        />
        <SummaryCard
          icon={<Gauge size={18} />}
          label="Electricity"
          value={pence(tm.electricity_cost_minor)}
          sub={tm.electricity_units > 0 ? `${tm.electricity_units} kWh` : undefined}
          accent="bg-yellow-50 text-yellow-600"
        />
        {tm.gas_cost_minor > 0 && (
          <SummaryCard
            icon={<Flame size={18} />}
            label="Gas"
            value={pence(tm.gas_cost_minor)}
            accent="bg-orange-50 text-orange-600"
          />
        )}
        {tm.oil_cost_minor > 0 && (
          <SummaryCard
            icon={<Flame size={18} />}
            label="Oil"
            value={pence(tm.oil_cost_minor)}
            accent="bg-amber-50 text-amber-700"
          />
        )}
        <SummaryCard
          icon={<TrendingUp size={18} />}
          label="Total Energy"
          value={pence(tm.total_cost_minor)}
          accent="bg-primary/10 text-primary"
        />
      </div>

      {history.length > 0 && (
        <>
          <h3 className="text-body font-semibold text-secondary uppercase tracking-wide text-xs mt-6">
            EV Charging — Last 12 Months
          </h3>
          <div className="flex items-end gap-1 pt-2">
            {reversed.map((entry) => (
              <MonthBar key={`${entry.year}-${entry.month}`} entry={entry} maxCost={maxCost} />
            ))}
          </div>
          <div className="flex justify-between text-caption text-secondary">
            <span>£0</span>
            <span>{pence(maxCost)}</span>
          </div>
        </>
      )}
    </div>
  );
}
