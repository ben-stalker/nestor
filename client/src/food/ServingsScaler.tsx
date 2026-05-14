interface Props {
  baseServings: number;
  value: number;
  onChange: (n: number) => void;
}

const MULTIPLIERS = [1, 2, 4] as const;

export default function ServingsScaler({ baseServings, value, onChange }: Props) {
  function decrement() {
    onChange(Math.max(1, value - 1));
  }

  function increment() {
    onChange(Math.min(99, value + 1));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2" role="group" aria-label="Servings">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= 1}
          aria-label="Decrease servings"
          className="size-8 flex items-center justify-center rounded-full border border-surface-elev text-primary hover:bg-surface-elev disabled:opacity-40 transition-colors"
        >
          −
        </button>
        <span
          className="min-w-[2.5rem] text-center text-body font-medium text-primary"
          aria-live="polite"
          data-testid="servings-value"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= 99}
          aria-label="Increase servings"
          className="size-8 flex items-center justify-center rounded-full border border-surface-elev text-primary hover:bg-surface-elev disabled:opacity-40 transition-colors"
        >
          +
        </button>
      </div>

      {/* Quick-set pills */}
      <div className="flex gap-1" role="group" aria-label="Quick servings">
        {MULTIPLIERS.map((mult) => {
          const target = baseServings * mult;
          const isActive = value === target;
          return (
            <button
              key={mult}
              type="button"
              onClick={() => onChange(target)}
              data-testid={`servings-pill-${mult}`}
              aria-pressed={isActive}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-surface-elev text-secondary hover:bg-surface-elev/80'
              }`}
            >
              ×{mult}
            </button>
          );
        })}
      </div>
    </div>
  );
}
