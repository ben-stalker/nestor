import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState } from '../../shared/ui';
import { getMeterReadings, deleteMeterReading } from '../api';
import MeterReadingForm from './MeterReadingForm';
import type { FuelType, MeterReading } from '../types';

const FUEL_TYPES: FuelType[] = ['electricity', 'gas', 'oil', 'water'];
const FUEL_LABELS: Record<FuelType, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  oil: 'Oil',
  water: 'Water',
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SimpleBarChart({ readings }: { readings: MeterReading[] }) {
  const last12 = [...readings].slice(0, 12).reverse();
  if (last12.length === 0) return null;
  const maxValue = Math.max(...last12.map((r) => r.value));

  return (
    <div className="flex items-end gap-1 h-24" aria-label="Meter readings bar chart" role="img">
      {last12.map((reading) => {
        const heightPct = maxValue > 0 ? (reading.value / maxValue) * 100 : 0;
        return (
          <div
            key={reading.id}
            className="flex-1 bg-accent rounded-t opacity-80 hover:opacity-100 transition-opacity"
            style={{ height: `${heightPct}%` }}
            title={`${reading.value} ${reading.unit} — ${formatDate(reading.reading_date)}`}
            role="presentation"
          />
        );
      })}
    </div>
  );
}

export default function MeterReadingList() {
  const qc = useQueryClient();
  const [activeFuelType, setActiveFuelType] = useState<FuelType>('electricity');
  const [showForm, setShowForm] = useState(false);

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ['meter-readings', activeFuelType],
    queryFn: () => getMeterReadings(activeFuelType),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeterReading,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meter-readings'] });
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Meter Readings</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          Add Reading
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Fuel type">
        {FUEL_TYPES.map((ft) => (
          <button
            key={ft}
            type="button"
            onClick={() => setActiveFuelType(ft)}
            className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
              activeFuelType === ft
                ? 'bg-accent text-white'
                : 'bg-surface-elev text-secondary hover:text-primary'
            }`}
          >
            {FUEL_LABELS[ft]}
          </button>
        ))}
      </div>

      {!isLoading && readings.length > 0 && (
        <Card>
          <p className="text-caption text-secondary mb-2">
            Last {Math.min(readings.length, 12)} readings
          </p>
          <SimpleBarChart readings={readings} />
        </Card>
      )}

      <p className="text-caption text-secondary">
        Monthly readings help track usage and costs. Add a reading each month on the same date.
      </p>

      {isLoading && <p className="text-secondary text-body">Loading...</p>}
      {!isLoading && readings.length === 0 && (
        <EmptyState
          heading="No readings"
          body={`Add ${FUEL_LABELS[activeFuelType].toLowerCase()} meter readings to track usage.`}
        />
      )}
      {!isLoading && readings.length > 0 && (
        <ul className="space-y-2" role="list">
          {readings.map((reading) => (
            <li key={reading.id}>
              <Card padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body font-medium text-primary">
                      {reading.value} {reading.unit}
                    </p>
                    <p className="text-caption text-secondary">
                      {formatDate(reading.reading_date)}
                    </p>
                    {reading.cost_per_unit !== null && (
                      <p className="text-caption text-secondary">
                        {reading.cost_per_unit}p/{reading.unit}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteMutation.mutate(reading.id)}
                    aria-label={`Delete reading from ${formatDate(reading.reading_date)}`}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <MeterReadingForm
        open={showForm}
        defaultFuelType={activeFuelType}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
