import AvatarStrip from '../../core/AvatarStrip';
import HomeHeader from './HomeHeader';
import DayCarousel from './DayCarousel';

/** Placeholder section until the relevant story is implemented */
function PlaceholderSection({ label }: { label: string }) {
  return (
    <section
      className="home-placeholder-section"
      aria-label={label}
      data-testid={`placeholder-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <p className="home-placeholder-section__label">{label}</p>
    </section>
  );
}

function carouselRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function HomePage() {
  const { start, end } = carouselRange();
  return (
    <main className="home-page" data-testid="home-page">
      <HomeHeader />
      <AvatarStrip />
      <PlaceholderSection label="Alerts" />
      <DayCarousel start={start} end={end} />
      <PlaceholderSection label="Journey Widget" />
      <PlaceholderSection label="Plugin Strip" />
    </main>
  );
}
