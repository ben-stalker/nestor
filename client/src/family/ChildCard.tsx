import type { ChildSummary } from './types';

interface Props {
  summary: ChildSummary;
  onClick: () => void;
}

function formatRelativeDay(ms: number): string {
  const diff = ms - Date.now();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

export default function ChildCard({ summary, onClick }: Props) {
  const { profile, todayChores, todayChoreTotal, pointsBalance, nextEvent } = summary;

  return (
    <button
      type="button"
      className="child-card"
      style={{ borderLeftColor: profile.colour }}
      onClick={onClick}
      aria-label={`View ${profile.name}'s details`}
    >
      <div className="child-card__header">
        <div className="child-card__avatar" style={{ background: profile.colour }}>
          <span className="child-card__initials">{profile.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="child-card__info">
          <span className="child-card__name">{profile.name}</span>
          <span className="child-card__type">{profile.type}</span>
        </div>
      </div>

      <div className="child-card__stats">
        <div className="child-card__stat">
          <span className="child-card__stat-value">
            {todayChores}/{todayChoreTotal}
          </span>
          <span className="child-card__stat-label">Chores today</span>
        </div>
        <div className="child-card__stat">
          <span className="child-card__stat-value">{pointsBalance}</span>
          <span className="child-card__stat-label">Stars</span>
        </div>
      </div>

      {nextEvent && (
        <div className="child-card__next-event">
          <span className="child-card__next-event-label">Next: </span>
          <span className="child-card__next-event-title">{nextEvent.title}</span>
          <span className="child-card__next-event-when">
            {formatRelativeDay(nextEvent.start_datetime)}
          </span>
        </div>
      )}
    </button>
  );
}
