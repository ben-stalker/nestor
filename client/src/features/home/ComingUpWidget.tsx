import { useNavigate } from 'react-router-dom';
import { useComingUp } from '../../hooks/useComingUp';
import type { ComingUpItem } from '../../api/comingUp';
import Skeleton from '../../shared/ui/Skeleton';

function DayChip({ days }: { days: number }) {
  return (
    <span className="coming-up__chip" aria-label={`in ${days} day${days === 1 ? '' : 's'}`}>
      {days === 0 ? 'today' : `${days}d`}
    </span>
  );
}

function ComingUpRow({ item }: { item: ComingUpItem }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.deepLink) void navigate(item.deepLink);
  };

  return (
    <button
      type="button"
      className="coming-up__row"
      onClick={handleClick}
      disabled={!item.deepLink}
      data-testid={`coming-up-item-${item.id}`}
    >
      <span className="coming-up__title">{item.title}</span>
      <DayChip days={item.daysUntil} />
    </button>
  );
}

export default function ComingUpWidget() {
  const { data, isLoading } = useComingUp();

  if (isLoading) {
    return (
      <section className="coming-up" aria-label="Coming up" data-testid="coming-up-widget">
        <h2 className="coming-up__heading">Coming up</h2>
        <Skeleton className="h-10 w-full rounded-xl mb-2" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </section>
    );
  }

  if (!data || data.items.length === 0) return null;

  return (
    <section className="coming-up" aria-label="Coming up" data-testid="coming-up-widget">
      <h2 className="coming-up__heading">Coming up</h2>
      {data.items.map((item) => (
        <ComingUpRow key={item.id} item={item} />
      ))}
    </section>
  );
}
