import { useState } from 'react';
import MessageBoard from './MessageBoard';
import WhiteboardTab from './Whiteboard';
import CountdownList from './CountdownList';
import ListsTab from './ListsTab';
import GuestVisitTab from './GuestVisitTab';

type BoardTab = 'messages' | 'whiteboard' | 'countdowns' | 'lists' | 'guests';

const TABS: Array<{ id: BoardTab; label: string }> = [
  { id: 'messages', label: 'Messages' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'countdowns', label: 'Countdowns' },
  { id: 'lists', label: 'Lists' },
  { id: 'guests', label: 'Guest Visits' },
];

export default function BoardPage() {
  const [tab, setTab] = useState<BoardTab>('messages');

  return (
    <main className="flex flex-col h-full" data-testid="board-page">
      <div
        className="flex overflow-x-auto border-b border-surface-elev"
        role="tablist"
        aria-label="Board sections"
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
        {tab === 'messages' && <MessageBoard />}
        {tab === 'whiteboard' && <WhiteboardTab />}
        {tab === 'countdowns' && <CountdownList />}
        {tab === 'lists' && <ListsTab />}
        {tab === 'guests' && <GuestVisitTab />}
      </div>
    </main>
  );
}
