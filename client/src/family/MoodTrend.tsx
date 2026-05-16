import { useQuery } from '@tanstack/react-query';
import { getMoodTrend } from './api';

interface Props {
  profileId: number;
}

const EMOJI_FOR_SCORE = ['😢', '😞', '😐', '🙂', '😄'];

const WIDTH = 360;
const HEIGHT = 120;
const PAD = { top: 12, right: 16, bottom: 24, left: 28 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

export default function MoodTrend({ profileId }: Props) {
  const { data: trend = [], isLoading } = useQuery({
    queryKey: ['mood-trend', profileId],
    queryFn: () => getMoodTrend(profileId),
    staleTime: 60_000,
  });

  if (isLoading) return <div>Loading mood trend…</div>;
  if (trend.length === 0) {
    return <p className="mood-trend__empty">No mood entries in the last 30 days.</p>;
  }

  const n = trend.length;
  const barW = Math.min(20, PLOT_W / n - 2);

  return (
    <div className="mood-trend">
      <h3 className="mood-trend__title">Mood — last 30 days</h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-label="Mood trend chart"
        role="img"
        className="mood-trend__svg"
      >
        {/* Y axis ticks */}
        {[1, 2, 3, 4, 5].map((score) => {
          const y = PAD.top + PLOT_H - ((score - 1) / 4) * PLOT_H;
          return (
            <g key={score}>
              <line x1={PAD.left - 4} x2={PAD.left} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize={8} fill="#94a3b8">
                {EMOJI_FOR_SCORE[score - 1]}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {trend.map((point, i) => {
          const x = PAD.left + (i / (n - 1 || 1)) * PLOT_W - barW / 2;
          const barH = ((point.score - 1) / 4) * PLOT_H;
          const y = PAD.top + PLOT_H - barH;
          const hue = ((point.score - 1) / 4) * 120;
          return (
            <g key={point.date}>
              <rect x={x} y={y} width={barW} height={barH} fill={`hsl(${hue},60%,55%)`} rx={2}>
                <title>{`${point.date}: ${EMOJI_FOR_SCORE[point.score - 1]}`}</title>
              </rect>
            </g>
          );
        })}
        {/* X axis: first and last dates */}
        <text x={PAD.left} y={HEIGHT - 4} textAnchor="start" fontSize={8} fill="#94a3b8">
          {trend[0].date.slice(5)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" fontSize={8} fill="#94a3b8">
          {trend[trend.length - 1].date.slice(5)}
        </text>
      </svg>
    </div>
  );
}
