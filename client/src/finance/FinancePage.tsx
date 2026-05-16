import { useState } from 'react';
import AgreementList from './agreements/AgreementList';
import SavingsGoalList from './savings/SavingsGoalList';
import CommitmentsSummary from './summary/CommitmentsSummary';

type FinanceTab = 'agreements' | 'savings' | 'summary';

const TABS: Array<{ id: FinanceTab; label: string }> = [
  { id: 'agreements', label: 'Agreements' },
  { id: 'savings', label: 'Savings Goals' },
  { id: 'summary', label: 'Summary' },
];

export default function FinancePage() {
  const [tab, setTab] = useState<FinanceTab>('agreements');

  return (
    <main className="flex flex-col h-full" data-testid="finance-page">
      <div
        className="flex overflow-x-auto border-b border-surface-elev"
        role="tablist"
        aria-label="Finance sections"
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
        {tab === 'agreements' && <AgreementList />}
        {tab === 'savings' && <SavingsGoalList />}
        {tab === 'summary' && <CommitmentsSummary />}
      </div>
    </main>
  );
}
