import { useState } from 'react';
import BinScheduleList from './bins/BinScheduleList';
import SubscriptionList from './subscriptions/SubscriptionList';
import MaintenanceList from './maintenance/MaintenanceList';
import MeterReadingList from './meter/MeterReadingList';
import BudgetSummary from './budget/BudgetSummary';
import ChecklistList from './checklists/ChecklistList';
import AdultChoreRota from './chores/AdultChoreRota';
import AudioPanel from '../admin/AudioPanel';
import VoiceCommandHistory from '../voice/VoiceCommandHistory';
import QuietHoursBanner from '../voice/QuietHoursBanner';

type HouseTab =
  | 'bins'
  | 'subscriptions'
  | 'maintenance'
  | 'meter'
  | 'budget'
  | 'checklists'
  | 'chores'
  | 'notifications'
  | 'voice';

const TABS: Array<{ id: HouseTab; label: string }> = [
  { id: 'bins', label: 'Bins' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'meter', label: 'Meter' },
  { id: 'budget', label: 'Budget' },
  { id: 'checklists', label: 'Checklists' },
  { id: 'chores', label: 'Chores' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'voice', label: 'Voice' },
];

export default function HousePage() {
  const [tab, setTab] = useState<HouseTab>('bins');

  return (
    <main className="flex flex-col h-full" data-testid="house-page">
      <div
        className="flex overflow-x-auto border-b border-surface-elev"
        role="tablist"
        aria-label="House sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-3 text-body font-medium transition-colors border-b-2 -mb-px ${
              tab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'bins' && <BinScheduleList />}
        {tab === 'subscriptions' && <SubscriptionList />}
        {tab === 'maintenance' && <MaintenanceList />}
        {tab === 'meter' && <MeterReadingList />}
        {tab === 'budget' && <BudgetSummary />}
        {tab === 'checklists' && <ChecklistList />}
        {tab === 'chores' && <AdultChoreRota />}
        {tab === 'notifications' && <AudioPanel />}
        {tab === 'voice' && (
          <div className="p-4 flex flex-col gap-4">
            <QuietHoursBanner />
            <VoiceCommandHistory />
          </div>
        )}
      </div>
    </main>
  );
}
