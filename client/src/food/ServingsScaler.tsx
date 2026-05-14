interface Props {
  baseServings: number;
  value: number;
  onChange: (n: number) => void;
}

export default function ServingsScaler({ baseServings: _baseServings, value, onChange }: Props) {
  function decrement() {
    onChange(Math.max(1, value - 1));
  }

  function increment() {
    onChange(Math.min(99, value + 1));
  }

  return (
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
  );
}
