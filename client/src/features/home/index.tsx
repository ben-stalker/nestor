import AvatarStrip from '../../core/AvatarStrip';
import HomeHeader from './HomeHeader';

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

export default function HomePage() {
  return (
    <main className="home-page" data-testid="home-page">
      <HomeHeader />
      <AvatarStrip />
      <PlaceholderSection label="Alerts" />
      <PlaceholderSection label="Day Carousel" />
      <PlaceholderSection label="Journey Widget" />
      <PlaceholderSection label="Plugin Strip" />
    </main>
  );
}
