import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Droplets } from 'lucide-react';
import { useActiveProfile } from '../../core/hooks/useActiveProfile';
import { useWeather } from '../../hooks/useWeather';
import { useAppSettings } from '../../core/hooks/useAppSettings';
import { weatherDescription } from '../../api/weather';
import Skeleton from '../../shared/ui/Skeleton';
import WeatherModal from './WeatherModal';

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

function fmtTemp(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') return `${Math.round(celsius * 1.8 + 32)}°F`;
  return `${Math.round(celsius)}°C`;
}

export default function HomeHeader() {
  const profile = useActiveProfile();
  const { data: weather, isLoading: weatherLoading, isError: weatherError } = useWeather();
  const { data: settings } = useAppSettings();
  const unit = settings?.temperature_unit ?? 'celsius';

  const [now, setNow] = useState(() => new Date());
  const [forecastOpen, setForecastOpen] = useState(false);

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

  const precipPct = weather?.daily.precipitation_probability_max?.[0] ?? null;
  const uvMax = weather?.daily.uv_index_max?.[0] ?? null;

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

      <button
        className="home-header__weather"
        onClick={() => weather && setForecastOpen(true)}
        aria-label="Open weather forecast"
        disabled={!weather}
        type="button"
      >
        {weatherLoading && <Skeleton className="h-12 w-24 rounded-xl" />}
        {!weatherLoading && weather && (
          <>
            <WeatherIcon code={weather.current.weather_code} className="size-8" />
            <div className="home-header__weather-temps">
              <span className="home-header__weather-current">
                {fmtTemp(weather.current.temperature_2m, unit)}
              </span>
              {weather.daily.time.length > 0 && (
                <span className="home-header__weather-range">
                  {fmtTemp(weather.daily.temperature_2m_max[0], unit)}
                  {' / '}
                  {fmtTemp(weather.daily.temperature_2m_min[0], unit)}
                </span>
              )}
            </div>
            <div className="home-header__weather-meta">
              {precipPct != null && (
                <span
                  className="home-header__weather-precip"
                  aria-label={`Precipitation probability: ${precipPct}%`}
                  data-testid="weather-precip"
                >
                  {precipPct}%
                </span>
              )}
              {uvMax != null && (
                <span
                  className="home-header__weather-uv"
                  aria-label={`UV index: ${Math.round(uvMax)}`}
                  data-testid="weather-uv"
                >
                  UV {Math.round(uvMax)}
                </span>
              )}
            </div>
            <span className="home-header__weather-desc sr-only">
              {weatherDescription(weather.current.weather_code)}
            </span>
          </>
        )}
        {!weatherLoading && weatherError && !weather && (
          <span className="home-header__weather-error" data-testid="weather-error">
            Weather unavailable
          </span>
        )}
      </button>

      {weather && (
        <WeatherModal
          open={forecastOpen}
          onClose={() => setForecastOpen(false)}
          weather={weather}
          unit={unit}
        />
      )}
    </header>
  );
}
