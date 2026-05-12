import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Droplets } from 'lucide-react';
import { useActiveProfile } from '../../core/hooks/useActiveProfile';
import { useWeather } from '../../hooks/useWeather';
import { weatherDescription } from '../../api/weather';
import Skeleton from '../../shared/ui/Skeleton';

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const cls = clsx('shrink-0', className);
  if (code === 0) return <Sun className={cls} />;
  if (code <= 2) return <Cloud className={clsx(cls, 'text-yellow-400')} />;
  if (code <= 3) return <Cloud className={cls} />;
  if (code <= 67) return <CloudRain className={cls} />;
  if (code <= 77) return <CloudSnow className={cls} />;
  if (code <= 82) return <Droplets className={cls} />;
  return <Zap className={cls} />;
}

export default function HomeHeader() {
  const profile = useActiveProfile();
  const { data: weather, isLoading: weatherLoading } = useWeather();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const ms = (60 - new Date().getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60_000);
      return () => clearInterval(interval);
    }, ms);
    return () => clearTimeout(timeout);
  }, []);

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const name = profile?.name ?? 'there';

  return (
    <header className="home-header" data-testid="home-header">
      <div className="home-header__greeting">
        <p className="home-header__greeting-label">{greeting(name)}</p>
      </div>

      <div className="home-header__datetime">
        <p className="home-header__date">{dateStr}</p>
        <p className="home-header__time" aria-label={`Time: ${timeStr}`}>
          {timeStr}
        </p>
      </div>

      <div className="home-header__weather">
        {weatherLoading && <Skeleton className="h-12 w-24 rounded-xl" />}
        {!weatherLoading && weather && (
          <>
            <WeatherIcon code={weather.current.weather_code} className="size-8" />
            <div className="home-header__weather-temps">
              <span className="home-header__weather-current">
                {Math.round(weather.current.temperature_2m)}°
              </span>
              {weather.daily.time.length > 0 && (
                <span className="home-header__weather-range">
                  {Math.round(weather.daily.temperature_2m_max[0])}°{' / '}
                  {Math.round(weather.daily.temperature_2m_min[0])}°
                </span>
              )}
            </div>
            <span className="home-header__weather-desc sr-only">
              {weatherDescription(weather.current.weather_code)}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
