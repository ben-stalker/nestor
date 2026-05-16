import { useQuery } from '@tanstack/react-query';
import { getGrowthData } from './api';

interface Props {
  profileId: number;
}

const WHO_WEIGHT_PERCENTILES: Record<string, number[]> = {
  '3': [2.5, 3.2, 4.0, 4.9, 5.8, 6.7, 7.5, 8.2, 8.9, 9.5, 9.9, 10.4],
  '15': [2.9, 3.7, 4.6, 5.6, 6.6, 7.5, 8.4, 9.1, 9.9, 10.5, 11.0, 11.5],
  '50': [3.3, 4.5, 5.6, 6.7, 7.8, 8.8, 9.7, 10.5, 11.2, 11.9, 12.5, 13.0],
  '85': [3.9, 5.3, 6.7, 8.0, 9.1, 10.2, 11.3, 12.2, 13.0, 13.8, 14.5, 15.1],
  '97': [4.4, 6.0, 7.5, 8.9, 10.2, 11.4, 12.5, 13.5, 14.4, 15.2, 16.0, 16.7],
};
const WHO_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const WIDTH = 480;
const HEIGHT = 260;
const PAD = { top: 16, right: 24, bottom: 40, left: 44 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function toX(month: number, maxMonth: number) {
  return PAD.left + (month / Math.max(maxMonth, 12)) * PLOT_W;
}

function toY(kg: number, minKg: number, maxKg: number) {
  return PAD.top + PLOT_H - ((kg - minKg) / (maxKg - minKg)) * PLOT_H;
}

function percentilePolyline(pct: string, maxMonth: number, minKg: number, maxKg: number) {
  const vals = WHO_WEIGHT_PERCENTILES[pct];
  const points = WHO_MONTHS.map((m, i) => `${toX(m, maxMonth)},${toY(vals[i], minKg, maxKg)}`);
  return points.join(' ');
}

const PCT_COLORS: Record<string, string> = {
  '3': '#e2e8f0',
  '15': '#94a3b8',
  '50': '#3b82f6',
  '85': '#94a3b8',
  '97': '#e2e8f0',
};

export default function GrowthChart({ profileId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['growth-data', profileId],
    queryFn: () => getGrowthData(profileId),
    staleTime: 60_000,
  });

  if (isLoading) return <div>Loading growth data…</div>;
  if (!data || data.points.length === 0) {
    return <p className="growth-chart__empty">No growth data logged yet.</p>;
  }

  const weightPoints = data.points.filter((p) => p.weight_kg !== null || p.value_kg !== null);

  if (weightPoints.length === 0) {
    return <p className="growth-chart__empty">Log weight measurements to see the chart.</p>;
  }

  const maxMonth = Math.max(12, ...weightPoints.map((p) => Math.ceil((p.age_weeks ?? 0) / 4.33)));
  const allWeights = [
    ...weightPoints.map((p) => p.weight_kg ?? p.value_kg ?? 0),
    ...Object.values(WHO_WEIGHT_PERCENTILES).flat(),
  ];
  const minKg = Math.floor(Math.min(...allWeights));
  const maxKg = Math.ceil(Math.max(...allWeights));

  const dataPolyline = weightPoints
    .map((p) => {
      const month = (p.age_weeks ?? 0) / 4.33;
      const kg = p.weight_kg ?? p.value_kg ?? 0;
      return `${toX(month, maxMonth)},${toY(kg, minKg, maxKg)}`;
    })
    .join(' ');

  const yTicks = Array.from({ length: maxKg - minKg + 1 }, (_, i) => minKg + i);
  const xTicks = Array.from({ length: Math.min(maxMonth, 12) + 1 }, (_, i) => i);

  return (
    <div className="growth-chart">
      <h3 className="growth-chart__title">Weight (WHO percentiles)</h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-label="Growth percentile chart"
        role="img"
        className="growth-chart__svg"
      >
        {/* Grid lines */}
        {yTicks.map((kg) => (
          <g key={kg}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={toY(kg, minKg, maxKg)}
              y2={toY(kg, minKg, maxKg)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 4}
              y={toY(kg, minKg, maxKg) + 4}
              textAnchor="end"
              fontSize={9}
              fill="#94a3b8"
            >
              {kg}
            </text>
          </g>
        ))}
        {xTicks.map((m) => (
          <g key={m}>
            <line
              x1={toX(m, maxMonth)}
              x2={toX(m, maxMonth)}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text
              x={toX(m, maxMonth)}
              y={HEIGHT - PAD.bottom + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              {m}m
            </text>
          </g>
        ))}

        {/* WHO percentile bands */}
        {['3', '15', '50', '85', '97'].map((pct) => (
          <polyline
            key={pct}
            points={percentilePolyline(pct, maxMonth, minKg, maxKg)}
            fill="none"
            stroke={PCT_COLORS[pct]}
            strokeWidth={pct === '50' ? 1.5 : 1}
            strokeDasharray={pct === '50' ? undefined : '4 2'}
          />
        ))}

        {/* Baby data */}
        {weightPoints.length > 1 && (
          <polyline points={dataPolyline} fill="none" stroke="#f97316" strokeWidth={2} />
        )}
        {weightPoints.map((p, i) => {
          const month = (p.age_weeks ?? 0) / 4.33;
          const kg = p.weight_kg ?? p.value_kg ?? 0;
          return (
            <circle
              key={i}
              cx={toX(month, maxMonth)}
              cy={toY(kg, minKg, maxKg)}
              r={4}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={1.5}
            >
              <title>{`${kg} kg at ${Math.round(month)} months`}</title>
            </circle>
          );
        })}

        {/* Axis labels */}
        <text x={WIDTH / 2} y={HEIGHT} textAnchor="middle" fontSize={10} fill="#64748b">
          Age (months)
        </text>
        <text
          x={10}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
          transform={`rotate(-90, 10, ${HEIGHT / 2})`}
        >
          kg
        </text>
      </svg>

      <div className="growth-chart__legend">
        <span>3rd</span>
        <span>15th</span>
        <span style={{ color: '#3b82f6' }}>50th</span>
        <span>85th</span>
        <span>97th</span>
        <span style={{ color: '#f97316' }}>Baby</span>
      </div>

      <table className="growth-chart__table">
        <caption>Measurements</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Weight</th>
            <th>Height</th>
            <th>Head</th>
          </tr>
        </thead>
        <tbody>
          {data.points.map((p, i) => {
            let weightCell = '—';
            if (p.weight_kg != null) weightCell = `${p.weight_kg} kg`;
            else if (p.value_kg != null) weightCell = `${p.value_kg} kg`;
            return (
              <tr key={i}>
                <td>{new Date(p.logged_at).toLocaleDateString('en-GB')}</td>
                <td>{weightCell}</td>
                <td>{p.height_cm != null ? `${p.height_cm} cm` : '—'}</td>
                <td>{p.head_cm != null ? `${p.head_cm} cm` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
