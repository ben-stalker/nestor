import type { PetHealthLog } from '../types';

interface WeightChartProps {
  logs: PetHealthLog[];
}

interface DataPoint {
  date: string;
  weight: number;
}

export default function WeightChart({ logs }: WeightChartProps) {
  const weightLogs: DataPoint[] = logs
    .filter((l) => l.log_type === 'weight' && l.weight_kg != null)
    .map((l) => ({ date: l.log_date, weight: l.weight_kg! }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weightLogs.length === 0) return null;

  const latest = weightLogs[weightLogs.length - 1];

  if (weightLogs.length === 1) {
    return (
      <div className="p-4 bg-surface-elev rounded-card" data-testid="weight-chart">
        <p className="text-caption text-secondary mb-1">Latest weight</p>
        <p className="text-h2 font-bold text-primary">{latest.weight.toFixed(1)} kg</p>
        <p className="text-caption text-secondary">{latest.date}</p>
      </div>
    );
  }

  const HEIGHT = 200;
  const PADDING = { top: 16, right: 16, bottom: 24, left: 40 };
  const WIDTH = 100; // viewBox percentage units, actual width via CSS

  const weights = weightLogs.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const points = weightLogs.map((d, i) => {
    const x = PADDING.left + (i / (weightLogs.length - 1)) * plotW;
    const y = PADDING.top + (1 - (d.weight - minW) / range) * plotH;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const formatLabel = (w: number) => `${w.toFixed(1)}`;

  return (
    <div className="p-4 bg-surface-elev rounded-card" data-testid="weight-chart">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-caption text-secondary">Latest weight</p>
          <p className="text-h2 font-bold text-primary">{latest.weight.toFixed(1)} kg</p>
        </div>
        <p className="text-caption text-secondary">{latest.date}</p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: HEIGHT }}
        aria-label="Weight over time chart"
        role="img"
      >
        {/* Y axis labels */}
        <text
          x={PADDING.left - 4}
          y={PADDING.top + 4}
          textAnchor="end"
          fontSize={8}
          fill="currentColor"
          className="text-secondary"
        >
          {formatLabel(maxW)}
        </text>
        <text
          x={PADDING.left - 4}
          y={PADDING.top + plotH}
          textAnchor="end"
          fontSize={8}
          fill="currentColor"
          className="text-secondary"
        >
          {formatLabel(minW)}
        </text>
        {/* Grid lines */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left + plotW}
          y2={PADDING.top}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top + plotH}
          x2={PADDING.left + plotW}
          y2={PADDING.top + plotH}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />
        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r={2} fill="#22c55e" />
        ))}
        {/* X axis labels for first & last */}
        <text
          x={points[0].x}
          y={HEIGHT - 2}
          textAnchor="start"
          fontSize={7}
          fill="currentColor"
          className="text-secondary"
        >
          {weightLogs[0].date}
        </text>
        <text
          x={points[points.length - 1].x}
          y={HEIGHT - 2}
          textAnchor="end"
          fontSize={7}
          fill="currentColor"
          className="text-secondary"
        >
          {latest.date}
        </text>
      </svg>
    </div>
  );
}
