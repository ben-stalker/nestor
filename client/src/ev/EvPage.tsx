import { useState } from 'react';
import { Zap, BarChart2, Settings, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getVehicles } from '../vehicles/api';
import ChargingLogList from './ChargingLogList';
import EnergyOverview from './EnergyOverview';
import FuelRatesPanel from './FuelRatesPanel';
import PlugInReminderPanel from './PlugInReminderPanel';

type Tab = 'charging' | 'overview' | 'rates' | 'reminders';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'charging', label: 'Charging', icon: <Zap size={16} /> },
  { id: 'overview', label: 'Energy', icon: <BarChart2 size={16} /> },
  { id: 'rates', label: 'Rates', icon: <Settings size={16} /> },
  { id: 'reminders', label: 'Reminders', icon: <Bell size={16} /> },
];

export default function EvPage() {
  const [activeTab, setActiveTab] = useState<Tab>('charging');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>();

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  return (
    <main className="flex flex-col h-full">
      <header className="px-4 pt-4 pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={22} className="text-mode-ev" />
          <h1 className="text-h1 font-bold">EV & Energy</h1>
        </div>

        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto pb-1 scrollbar-none"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-mode-ev text-white'
                  : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'charging' && (
          <ChargingLogList
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleChange={setSelectedVehicleId}
          />
        )}
        {activeTab === 'overview' && <EnergyOverview />}
        {activeTab === 'rates' && <FuelRatesPanel />}
        {activeTab === 'reminders' && <PlugInReminderPanel vehicles={vehicles} />}
      </div>
    </main>
  );
}
