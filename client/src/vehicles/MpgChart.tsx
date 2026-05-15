interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  points: DataPoint[];
  unit: string; // 'mpg' or 'L/100km'
}

export default function MpgChart({ points, unit }: Props) {
  if (points.length < 2) return null;

  const W = 300;
  const H = 80;
  const PAD = 12;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const last = points[points.length - 1];

  return (
    <div className="space-y-1">
      <p className="text-xs text-secondary">Efficiency (last {points.length})</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" aria-hidden="true">
        <polyline
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          points={points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ')}
        />
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.value)} r="3" fill="var(--color-accent)" />
        ))}
      </svg>
      <p className="text-xs text-secondary text-right">
        Latest:{' '}
        <span className="font-medium text-primary">
          {last.value.toFixed(1)} {unit}
        </span>
      </p>
    </div>
  );
}
