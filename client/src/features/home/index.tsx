import AvatarStrip from '../../core/AvatarStrip';
import HomeHeader from './HomeHeader';
import DayCarousel from './DayCarousel';
import AlertsStrip from './AlertsStrip';
import JourneyWidget from './JourneyWidget';
import PluginWidgetStrip from './PluginWidgetStrip';

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
      <AlertsStrip />
      <DayCarousel start={start} end={end} />
      <JourneyWidget />
      <PluginWidgetStrip />
    </main>
  );
}
