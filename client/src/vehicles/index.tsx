import { useState } from 'react';
import VehicleList from './VehicleList';
import VehicleDetail from './VehicleDetail';
import type { Vehicle } from './types';

export default function VehiclePage() {
  const [selected, setSelected] = useState<Vehicle | null>(null);

  if (selected) {
    return <VehicleDetail vehicle={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <main className="vehicles-page flex-1 overflow-y-auto p-4 bg-[var(--color-bg)]">
      <VehicleList onSelect={(v) => setSelected(v)} />
    </main>
  );
}
