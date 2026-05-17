import { useState } from 'react';
import { Zap, Flame, AlertCircle } from 'lucide-react';
import Skeleton from '../shared/ui/Skeleton';
import OctopusConsumptionChart from './OctopusConsumptionChart';
import { useOctopusStatus, useOctopusConsumption } from './api';

type Period = 7 | 14 | 30;
type FuelTab = 'electricity' | 'gas';

const PERIODS: Period[] = [7, 14, 30];

export default function OctopusTab() {
  const [period, setPeriod] = useState<Period>(14);
  const [fuelTab, setFuelTab] = useState<FuelTab>('electricity');

  const { data: status, isLoading: statusLoading } = useOctopusStatus();
  const hasGas = Boolean(status?.gasMprn);

  const { data: consumption, isLoading: consumptionLoading } = useOctopusConsumption(
    fuelTab,
    period,
  );

  if (statusLoading) {
    return (
      <div className="space-y-3" data-testid="loading-skeleton">
        <Skeleton className="h-8 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div
        className="p-4 rounded-card bg-surface border border-neutral-100 space-y-2"
        data-testid="not-configured-placeholder"
      >
        <div className="flex items-center gap-2 text-secondary">
          <AlertCircle size={16} />
          <span className="text-body font-medium">Octopus Energy not connected</span>
        </div>
        <p className="text-caption text-secondary">
          Connect your Octopus Energy account in the settings below to view consumption data.
        </p>
      </div>
    );
  }

  const data = consumption?.data ?? [];
  const unitRatePence = consumption?.unitRatePence ?? 0;
  const standingChargePence = consumption?.standingChargePence ?? 0;

  const totalKwh = data.reduce((sum, d) => sum + d.kwh, 0);
  const totalCostMinor = data.reduce((sum, d) => sum + d.costMinor, 0);
  const avgKwhPerDay = data.length > 0 ? totalKwh / data.length : 0;

  return (
    <div className="space-y-4">
      {/* Period switcher */}
      <div className="flex gap-1" data-testid="period-switcher">
        {PERIODS.map((p) => (
          <button
            key={p}
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
              period === p
                ? 'bg-mode-ev text-white'
                : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
            }`}
          >
            {p}d
          </button>
        ))}
      </div>

      {/* Fuel type tabs */}
      <div className="flex gap-2 border-b border-neutral-100 pb-2" data-testid="fuel-type-tabs">
        <button
          role="tab"
          aria-selected={fuelTab === 'electricity'}
          onClick={() => setFuelTab('electricity')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-caption font-medium transition-colors ${
            fuelTab === 'electricity'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Zap size={14} />
          Electricity
        </button>
        {hasGas && (
          <button
            role="tab"
            aria-selected={fuelTab === 'gas'}
            onClick={() => setFuelTab('gas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-caption font-medium transition-colors ${
              fuelTab === 'gas'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Flame size={14} />
            Gas
          </button>
        )}
      </div>

      {/* Chart */}
      {consumptionLoading ? (
        <Skeleton className="h-48 rounded-card" data-testid="chart-skeleton" />
      ) : (
        <OctopusConsumptionChart data={data} fuelType={fuelTab} unitRatePence={unitRatePence} />
      )}

      {/* Summary stats */}
      {!consumptionLoading && data.length > 0 && (
        <div className="grid grid-cols-3 gap-3" data-testid="summary-stats">
          <div className="p-3 rounded-card bg-surface border border-neutral-100 text-center">
            <div className="text-h2 font-bold">{totalKwh.toFixed(1)}</div>
            <div className="text-caption text-secondary">kWh total</div>
          </div>
          <div className="p-3 rounded-card bg-surface border border-neutral-100 text-center">
            <div className="text-h2 font-bold">£{(totalCostMinor / 100).toFixed(2)}</div>
            <div className="text-caption text-secondary">est. cost</div>
          </div>
          <div className="p-3 rounded-card bg-surface border border-neutral-100 text-center">
            <div className="text-h2 font-bold">{avgKwhPerDay.toFixed(1)}</div>
            <div className="text-caption text-secondary">kWh/day avg</div>
          </div>
        </div>
      )}

      {/* Tariff info */}
      {unitRatePence > 0 && (
        <div className="text-caption text-secondary flex gap-4">
          <span>{unitRatePence.toFixed(2)}p/kWh unit rate</span>
          {standingChargePence > 0 && (
            <span>{standingChargePence.toFixed(2)}p/day standing charge</span>
          )}
        </div>
      )}
    </div>
  );
}
