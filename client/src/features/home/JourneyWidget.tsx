import { Train, Car, Footprints, Bike, MapPin } from 'lucide-react';
import { useJourneyEtas } from '../../hooks/useJourneys';
import type { JourneyEta } from '../../api/journeys';
import EmptyState from '../../shared/ui/EmptyState';
import Skeleton from '../../shared/ui/Skeleton';

function ModeIcon({ mode, className }: { mode: string; className?: string }) {
  if (mode === 'drive') return <Car className={className} aria-hidden="true" />;
  if (mode === 'walk') return <Footprints className={className} aria-hidden="true" />;
  if (mode === 'cycle') return <Bike className={className} aria-hidden="true" />;
  return <Train className={className} aria-hidden="true" />;
}

function JourneyRow({ eta }: { eta: JourneyEta }) {
  return (
    <div className="journey-widget__row" data-testid={`journey-row-${eta.journeyId}`}>
      <ModeIcon mode={eta.transportMode} className="journey-widget__mode-icon" />
      <div className="journey-widget__route">
        <span className="journey-widget__label">{eta.label}</span>
        <span className="journey-widget__stops">
          {eta.origin}
          <MapPin className="size-3 mx-1 inline-block" aria-hidden="true" />
          {eta.destination}
        </span>
      </div>
      <span className="journey-widget__eta" aria-label={`${eta.etaMinutes ?? '—'} minutes`}>
        {eta.etaMinutes != null ? `${eta.etaMinutes} min` : '—'}
      </span>
    </div>
  );
}

export default function JourneyWidget() {
  const { data: etas, isLoading } = useJourneyEtas();

  if (isLoading) {
    return (
      <section className="journey-widget" aria-label="Journey times" data-testid="journey-widget">
        <Skeleton className="h-12 w-full rounded-xl mb-2" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </section>
    );
  }

  if (!etas || etas.length === 0) {
    return (
      <section className="journey-widget" aria-label="Journey times" data-testid="journey-widget">
        <EmptyState heading="Add a saved journey in Settings" icon={<MapPin />} />
      </section>
    );
  }

  return (
    <section className="journey-widget" aria-label="Journey times" data-testid="journey-widget">
      {etas.map((eta) => (
        <JourneyRow key={eta.journeyId} eta={eta} />
      ))}
    </section>
  );
}
