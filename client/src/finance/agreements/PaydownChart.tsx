import { useQuery } from '@tanstack/react-query';
import { getPaydownSchedule } from '../api';

function formatMinor(minor: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

interface Props {
  agreementId: number;
  name: string;
  currency?: string;
}

export default function PaydownChart({ agreementId, name, currency = 'GBP' }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['paydown', agreementId],
    queryFn: () => getPaydownSchedule(agreementId),
    staleTime: 300_000,
  });

  if (isLoading) {
    return <p className="text-caption text-secondary py-2">Loading paydown schedule...</p>;
  }

  if (!data || data.months.length === 0) {
    return (
      <p className="text-caption text-secondary py-2">
        Add balance and monthly payment to see paydown schedule.
      </p>
    );
  }

  const maxBalance = data.months[0]?.balance_minor ?? 0;
  if (maxBalance === 0) return null;

  // Show every Nth label to avoid crowding
  const totalMonths = data.months.length;
  let labelInterval: number;
  if (totalMonths <= 12) labelInterval = 1;
  else if (totalMonths <= 36) labelInterval = 3;
  else if (totalMonths <= 60) labelInterval = 6;
  else labelInterval = 12;

  const chartHeight = 80;
  const barWidth = Math.max(2, Math.min(12, Math.floor(280 / totalMonths)));
  const gap = Math.max(1, barWidth > 4 ? 1 : 0);
  const chartWidth = totalMonths * (barWidth + gap);

  return (
    <div className="mt-3" data-testid="paydown-chart">
      <p className="text-caption text-secondary mb-1 font-medium">
        Debt paydown — {totalMonths} months
      </p>
      <div className="overflow-x-auto">
        <svg
          width={Math.max(chartWidth, 280)}
          height={chartHeight + 20}
          aria-label={`Debt paydown schedule for ${name}`}
          role="img"
        >
          {data.months.map((month, i) => {
            const barH = Math.round((month.balance_minor / maxBalance) * chartHeight);
            const x = i * (barWidth + gap);
            const y = chartHeight - barH;
            const showLabel = i === 0 || (i + 1) % labelInterval === 0 || i === totalMonths - 1;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill="var(--color-accent, #7C3AED)"
                  opacity={0.7 + 0.3 * (1 - month.balance_minor / maxBalance)}
                  rx={1}
                >
                  <title>
                    {month.label}: {formatMinor(month.balance_minor, currency)} remaining
                  </title>
                </rect>
                {showLabel && barWidth >= 4 && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    fontSize={8}
                    fill="currentColor"
                    className="text-secondary"
                    opacity={0.6}
                  >
                    {month.label.split(' ')[1]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-caption text-secondary">{formatMinor(maxBalance, currency)} now</span>
        <span className="text-caption text-green-500 font-medium">
          £0 in {data.months[data.months.length - 1]?.label}
        </span>
      </div>
    </div>
  );
}
