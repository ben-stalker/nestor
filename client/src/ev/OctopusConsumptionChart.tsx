import type { OctopusConsumptionDay } from './types';

interface Props {
  data: OctopusConsumptionDay[];
  fuelType: 'electricity' | 'gas';
  unitRatePence: number;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const LABEL_HEIGHT = 40;
const VIEW_BOX_HEIGHT = CHART_HEIGHT + LABEL_HEIGHT;
const BAR_GAP = 4;
const MIN_BAR_HEIGHT = 2;

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export default function OctopusConsumptionChart({ data, fuelType, unitRatePence }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-40 text-secondary text-caption rounded-card border border-neutral-100 bg-surface"
        data-testid="no-data-message"
      >
        No data yet
      </div>
    );
  }

  const barColour = fuelType === 'electricity' ? '#3b82f6' : '#f59e0b';
  const barWidth = Math.max(1, CHART_WIDTH / data.length - BAR_GAP);
  const maxKwh = Math.max(...data.map((d) => d.kwh), 0.001);

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${VIEW_BOX_HEIGHT}`}
      width="100%"
      height="auto"
      role="img"
      aria-label={`${fuelType} consumption chart`}
    >
      {data.map((day, i) => {
        const rawHeight = (day.kwh / maxKwh) * CHART_HEIGHT;
        const barHeight = Math.max(rawHeight, MIN_BAR_HEIGHT);
        const x = i * (CHART_WIDTH / data.length) + BAR_GAP / 2;
        const y = CHART_HEIGHT - barHeight;
        const costGbp = (day.costMinor / 100).toFixed(2);
        const label = formatDate(day.date);
        const labelX = x + barWidth / 2;

        return (
          <g key={day.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={barColour}
              rx={2}
              data-testid="chart-bar"
            >
              <title>
                {day.date}: {day.kwh.toFixed(2)}kWh / £{costGbp}
              </title>
            </rect>
            {/* x-axis label — show every nth label to avoid crowding */}
            {(data.length <= 14 || i % 3 === 0) && (
              <text
                x={labelX}
                y={CHART_HEIGHT + 16}
                textAnchor="middle"
                fontSize={data.length > 20 ? 8 : 10}
                fill="#6b7280"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
      {/* y-axis: max label */}
      <text x={4} y={12} fontSize={9} fill="#9ca3af">
        {maxKwh.toFixed(1)} kWh
      </text>
      {/* y-axis: unit rate label */}
      {unitRatePence > 0 && (
        <text x={4} y={VIEW_BOX_HEIGHT - 4} fontSize={9} fill="#9ca3af">
          {unitRatePence.toFixed(1)}p/kWh
        </text>
      )}
    </svg>
  );
}
