import { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Droplets } from 'lucide-react';
import { useActiveProfile } from './hooks/useActiveProfile';
import { useWeather } from '../hooks/useWeather';
import { useAppSettings } from './hooks/useAppSettings';
import { NAV_MODE_MAP } from './navModes';

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning,`;
  if (h < 17) return `Good afternoon,`;
  return `Good evening,`;
}

function WeatherIcon({ code, size = 20 }: { code: number; size?: number }) {
  const props = { size, strokeWidth: 1.5 };
  if (code === 0) return <Sun {...props} className="text-amber-400" />;
  if (code <= 2) return <Cloud {...props} className="text-amber-300" />;
  if (code <= 3) return <Cloud {...props} />;
  if (code <= 67) return <CloudRain {...props} />;
  if (code <= 77) return <CloudSnow {...props} />;
  if (code <= 82) return <Droplets {...props} />;
  return <Zap {...props} />;
}

function fmtTemp(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
  return unit === 'fahrenheit'
    ? `${Math.round(celsius * 1.8 + 32)}°`
    : `${Math.round(celsius)}°`;
}

export default function TopBar() {
  const [now, setNow] = useState(() => new Date());
  const location = useLocation();
  const profile = useActiveProfile();
  const { data: weather } = useWeather();
  const { data: settings } = useAppSettings();
  const unit = (settings?.temperature_unit as 'celsius' | 'fahrenheit') ?? 'celsius';

  useEffect(() => {
    const tick = () => setNow(new Date());
    const ms = (60 - new Date().getSeconds()) * 1000;
    const t = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60_000);
      return () => clearInterval(interval);
    }, ms);
    return () => clearTimeout(t);
  }, []);

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const dayNum = now.getDate();
  const monthStr = now.toLocaleDateString(undefined, { month: 'long' });

  const isHome = location.pathname === '/';
  const name = profile?.name ?? '';

  const currentMode = [...NAV_MODE_MAP.values()].find((m) =>
    m.route === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(m.route),
  );
  const accentColor = currentMode
    ? `var(--color-${currentMode.accent})`
    : 'var(--color-mode-home)';

  const precipPct = weather?.daily.precipitation_probability_max?.[0] ?? null;

  return (
    <header className="top-bar">
      {/* Left: N logo + context */}
      <div className="top-bar__left">
        <NavLink to="/" className="top-bar__logo" aria-label="Go to Home">
          <span className="top-bar__logo-n">N</span>
        </NavLink>
        <div className="top-bar__context">
          <span className="top-bar__section" style={{ color: accentColor }}>
            NESTOR{currentMode ? ` · ${currentMode.label.toUpperCase()}` : ''}
          </span>
          {isHome ? (
            <>
              <span className="top-bar__greeting">{greeting(name)}</span>
              {name && <span className="top-bar__name">{name}</span>}
            </>
          ) : (
            <span className="top-bar__name">{currentMode?.label ?? ''}</span>
          )}
        </div>
      </div>

      {/* Center: weekday + big date */}
      <div className="top-bar__date">
        <span className="top-bar__weekday">{weekday}</span>
        <div className="top-bar__date-main">
          <span className="top-bar__day font-playfair">{dayNum}</span>
          <span className="top-bar__month">{monthStr}</span>
        </div>
      </div>

      {/* Right: huge time */}
      <div className="top-bar__time-wrap">
        <span className="top-bar__time font-playfair">{timeStr}</span>
      </div>

      {/* Weather chip */}
      <div className="top-bar__weather">
        {weather ? (
          <>
            <WeatherIcon code={weather.current.weather_code} size={22} />
            <div className="top-bar__weather-info">
              <span className="top-bar__weather-temp">
                {fmtTemp(weather.current.temperature_2m, unit)}
              </span>
              <span className="top-bar__weather-range">
                ↑{fmtTemp(weather.daily.temperature_2m_max[0], unit)}{' '}
                ↓{fmtTemp(weather.daily.temperature_2m_min[0], unit)}
              </span>
              {precipPct != null && (
                <span className="top-bar__weather-precip">{precipPct}% rain</span>
              )}
            </div>
          </>
        ) : (
          <span className="top-bar__weather-empty">—</span>
        )}
      </div>
    </header>
  );
}
