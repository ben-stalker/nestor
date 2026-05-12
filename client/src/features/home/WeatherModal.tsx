import { Cloud, Sun, CloudRain, CloudSnow, Zap, Droplets } from 'lucide-react';
import Modal from '../../shared/ui/Modal';
import { type WeatherData, weatherDescription } from '../../api/weather';

interface WeatherModalProps {
  open: boolean;
  onClose: () => void;
  weather: WeatherData;
  unit: 'celsius' | 'fahrenheit';
}

function toF(c: number): number {
  return Math.round(c * 1.8 + 32);
}

function fmt(temp: number, unit: 'celsius' | 'fahrenheit'): string {
  const val = unit === 'fahrenheit' ? toF(temp) : Math.round(temp);
  return `${val}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />;
  if (code <= 2) return <Cloud className={className} style={{ color: 'var(--colour-warning)' }} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code <= 67) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code <= 82) return <Droplets className={className} />;
  return <Zap className={className} />;
}

function dayLabel(dateStr: string, idx: number): string {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tomorrow';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}

export default function WeatherModal({ open, onClose, weather, unit }: WeatherModalProps) {
  const { daily } = weather;

  return (
    <Modal open={open} onClose={onClose} title="7-Day Forecast">
      <div className="weather-modal__forecast" data-testid="weather-forecast">
        {daily.time.map((dateStr, idx) => (
          <div key={dateStr} className="weather-modal__day" data-testid={`forecast-day-${idx}`}>
            <span className="weather-modal__day-label">{dayLabel(dateStr, idx)}</span>
            <WeatherIcon code={daily.weather_code[idx]} className="weather-modal__day-icon" />
            <span className="weather-modal__day-desc sr-only">
              {weatherDescription(daily.weather_code[idx])}
            </span>
            <div className="weather-modal__day-temps">
              <span className="weather-modal__day-high">
                {fmt(daily.temperature_2m_max[idx], unit)}
              </span>
              <span className="weather-modal__day-low">
                {fmt(daily.temperature_2m_min[idx], unit)}
              </span>
            </div>
            <div className="weather-modal__day-meta">
              <span className="weather-modal__day-precip" title="Precipitation probability">
                {daily.precipitation_probability_max[idx] ?? 0}%
              </span>
              {daily.uv_index_max?.[idx] != null && (
                <span className="weather-modal__day-uv" title="UV index max">
                  UV {Math.round(daily.uv_index_max[idx])}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
