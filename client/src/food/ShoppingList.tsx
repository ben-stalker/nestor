import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  clearTickedItems,
} from './api';
import type { ShoppingItem } from './types';
import ShoppingItemRow from './ShoppingItemRow';
import { useWebSocket } from '../hooks/useWebSocket';
import { useActiveProfile } from '../core/hooks/useActiveProfile';

const CATEGORY_ORDER = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Pantry',
  'Frozen',
  'Drinks',
  'Seafood',
  'Other',
];

function normaliseCategory(cat: string | null): string {
  if (!cat) return 'Other';
  const found = CATEGORY_ORDER.find((c) => c.toLowerCase() === cat.toLowerCase());
  return found ?? 'Other';
}

export default function ShoppingList() {
  const qc = useQueryClient();
  const activeProfile = useActiveProfile();
  const isAdmin = activeProfile?.type === 'admin';

  const { lastMessage } = useWebSocket();

  // Optimistic local overrides for tick state: id -> ticked value
  const [optimisticTicks, setOptimisticTicks] = useState<Map<number, number>>(new Map());

  const { data: serverItems = [], isLoading } = useQuery({
    queryKey: ['shopping'],
    queryFn: getShoppingItems,
    staleTime: 60_000,
  });

  // Merge server items with optimistic overrides
  const items: ShoppingItem[] = serverItems.map((item) => {
    if (optimisticTicks.has(item.id)) {
      return { ...item, ticked: optimisticTicks.get(item.id)! };
    }
    return item;
  });

  // Invalidate on WS event
  useEffect(() => {
    if (lastMessage?.event === 'shopping:updated') {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
      setOptimisticTicks(new Map());
    }
  }, [lastMessage, qc]);

  // Quick-add state
  const [addName, setAddName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // Existing item names for autocomplete
  const existingNames = Array.from(new Set(items.map((i) => i.name)));

  const createMutation = useMutation({
    mutationFn: (name: string) => createShoppingItem({ name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
      setAddName('');
    },
  });

  const tickMutation = useMutation({
    mutationFn: ({ id, ticked }: { id: number; ticked: number }) =>
      updateShoppingItem(id, { ticked }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => updateShoppingItem(id, { pending_approval: 0 }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: number) => deleteShoppingItem(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const clearTickedMutation = useMutation({
    mutationFn: clearTickedItems,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
      setOptimisticTicks(new Map());
    },
  });

  function handleTick(id: number, ticked: boolean) {
    const tickedValue = ticked ? 1 : 0;
    // Optimistic update
    setOptimisticTicks((prev) => {
      const next = new Map(prev);
      next.set(id, tickedValue);
      return next;
    });
    tickMutation.mutate({ id, ticked: tickedValue });
  }

  function handleQuickAdd() {
    const name = addName.trim();
    if (!name) return;
    createMutation.mutate(name);
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleQuickAdd();
    }
  }

  // Separate items by status
  const pendingApproval = isAdmin ? items.filter((i) => i.pending_approval === 1) : [];
  const activeItems = items.filter((i) => i.ticked === 0 && i.pending_approval === 0);
  const tickedItems = items.filter((i) => i.ticked === 1);

  // Group active items by category
  const grouped = new Map<string, ShoppingItem[]>();
  CATEGORY_ORDER.forEach((cat) => {
    grouped.set(cat, []);
  });
  activeItems.forEach((item) => {
    const cat = normaliseCategory(item.category);
    const existing = grouped.get(cat) ?? [];
    grouped.set(cat, [...existing, item]);
  });

  const hasAnyItems = items.length > 0;
  const hasTickedItems = tickedItems.length > 0;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16 text-secondary"
        data-testid="shopping-list"
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="shopping-list">
      {/* Quick-add bar */}
      <div className="flex gap-2">
        <input
          ref={addInputRef}
          type="text"
          list="shopping-autocomplete"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onKeyDown={handleAddKeyDown}
          placeholder="Add item..."
          aria-label="Add shopping item"
          data-testid="shopping-add-input"
          className="flex-1 rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <datalist id="shopping-autocomplete">
          {existingNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!addName.trim() || createMutation.isPending}
          aria-label="Submit new shopping item"
          data-testid="shopping-add-submit"
          className="rounded-card bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Empty state */}
      {!hasAnyItems && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-2 text-center"
          data-testid="shopping-empty"
        >
          <span className="text-4xl" aria-hidden="true">
            🛒
          </span>
          <p className="text-body text-secondary">Your shopping list is empty. Add items above.</p>
        </div>
      )}

      {/* Awaiting Approval section (admin only) */}
      {pendingApproval.length > 0 && (
        <section>
          <h2 className="text-caption font-semibold text-secondary uppercase tracking-wide mb-1">
            Awaiting Approval
          </h2>
          <div className="rounded-card border border-surface-elev divide-y divide-surface-elev">
            {pendingApproval.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onTick={handleTick}
                onApprove={(id) => approveMutation.mutate(id)}
                onDecline={(id) => declineMutation.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category sections */}
      {Array.from(grouped.entries()).map(([cat, catItems]) => {
        if (catItems.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="text-caption font-semibold text-secondary uppercase tracking-wide mb-1">
              {cat}
            </h2>
            <div className="rounded-card border border-surface-elev divide-y divide-surface-elev">
              {catItems.map((item) => (
                <ShoppingItemRow key={item.id} item={item} onTick={handleTick} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Ticked section */}
      {hasTickedItems && (
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-caption font-semibold text-secondary uppercase tracking-wide">
              Ticked
            </h2>
            <button
              type="button"
              onClick={() => clearTickedMutation.mutate()}
              disabled={clearTickedMutation.isPending}
              data-testid="clear-ticked-btn"
              className="text-caption text-accent hover:underline disabled:opacity-50"
            >
              Clear ticked
            </button>
          </div>
          <div className="rounded-card border border-surface-elev divide-y divide-surface-elev">
            {tickedItems.map((item) => (
              <ShoppingItemRow key={item.id} item={item} onTick={handleTick} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
