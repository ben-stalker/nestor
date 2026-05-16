import type { ChecklistItem } from '../types';

function ChecklistItemRow({
  item,
  onTick,
}: {
  item: ChecklistItem;
  onTick: (id: number, ticked: boolean) => void;
}) {
  return (
    <li>
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={item.ticked}
          onChange={(e) => onTick(item.id, e.target.checked)}
          className="h-5 w-5 rounded border-surface-elev accent-accent"
          data-testid={`checklist-item-${item.id}`}
        />
        <span
          className={`text-body transition-colors ${
            item.ticked ? 'line-through text-secondary' : 'text-primary'
          }`}
        >
          {item.text}
        </span>
      </label>
    </li>
  );
}

interface ChecklistProps {
  items: ChecklistItem[];
  onTick: (id: number, ticked: boolean) => void;
  onReset?: () => void;
  showReset?: boolean;
}

export default function Checklist({ items, onTick, onReset, showReset }: ChecklistProps) {
  const sections = Array.from(new Set(items.map((i) => i.section)));
  const hasSections = sections.some((s) => s !== null);
  const tickedCount = items.filter((i) => i.ticked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-caption text-secondary">
          {tickedCount} / {items.length} done
        </p>
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-caption text-accent hover:underline"
            data-testid="reset-button"
          >
            Reset all
          </button>
        )}
      </div>

      {hasSections ? (
        sections.map((section) => (
          <div key={section ?? '__nosection__'}>
            {section && (
              <h4 className="text-caption font-semibold text-secondary uppercase tracking-wide mb-2">
                {section}
              </h4>
            )}
            <ul className="space-y-2" role="list">
              {items
                .filter((i) => i.section === section)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <ChecklistItemRow key={item.id} item={item} onTick={onTick} />
                ))}
            </ul>
          </div>
        ))
      ) : (
        <ul className="space-y-2" role="list">
          {[...items]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <ChecklistItemRow key={item.id} item={item} onTick={onTick} />
            ))}
        </ul>
      )}
    </div>
  );
}
