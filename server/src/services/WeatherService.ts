import eventBus from '../core/eventBus';
import logger from '../utils/logger';

export interface WeatherCurrent {
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  precipitation: number;
}

export interface WeatherHourly {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
}

export interface WeatherDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  uv_index_max: number[];
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: WeatherHourly;
  daily: WeatherDaily;
  fetchedAt: number;
}

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_PARAMS = 'temperature_2m,weather_code,wind_speed_10m,precipitation';
const HOURLY_PARAMS = 'temperature_2m,weather_code,precipitation_probability';
const DAILY_PARAMS =
  'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max';
const ALERT_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache: WeatherData | null = null;
let firstFailAt: number | null = null;
let alertFired = false;

export function getCached(): WeatherData | null {
  return cache;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_PARAMS}` +
    `&hourly=${HOURLY_PARAMS}` +
    `&daily=${DAILY_PARAMS}` +
    `&forecast_days=7&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo responded ${res.status}`);
  }
  const json = (await res.json()) as {
    current: WeatherCurrent;
    hourly: WeatherHourly;
    daily: WeatherDaily;
  };

  return {
    current: json.current,
    hourly: json.hourly,
    daily: json.daily,
    fetchedAt: Date.now(),
  };
}

export async function refresh(lat: number, lon: number): Promise<void> {
  try {
    const data = await fetchWeather(lat, lon);
    cache = data;
    firstFailAt = null;
    alertFired = false;
    logger.debug({ lat, lon }, 'Weather cache refreshed');
  } catch (err) {
    const now = Date.now();
    if (firstFailAt === null) firstFailAt = now;
    logger.warn({ err }, 'Weather refresh failed; serving stale cache');

    if (!alertFired && now - firstFailAt >= ALERT_THRESHOLD_MS) {
      alertFired = true;
      eventBus.emit('alert:new', {
        id: Date.now(),
        type: 'weather_down',
        message: 'Weather data unavailable for over 6 hours',
        createdAt: Date.now(),
      });
    }
  }
}

export function getForLocation(lat: number, lon: number): Promise<WeatherData | null> {
  if (cache) return Promise.resolve(cache);
  return refresh(lat, lon).then(() => cache);
}

/** Reset module state — for tests only */
export function resetForTests(): void {
  cache = null;
  firstFailAt = null;
  alertFired = false;
}
