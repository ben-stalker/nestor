import express from 'express';
import request from 'supertest';
import errorHandler from '../../src/middleware/errorHandler';
import createWeatherRouter from '../../src/routes/weather';
import type AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import * as WeatherService from '../../src/services/WeatherService';

const mockWeatherData: WeatherService.WeatherData = {
  current: { temperature_2m: 15, weather_code: 3, wind_speed_10m: 10, precipitation: 0 },
  hourly: {
    time: ['2026-05-12T00:00'],
    temperature_2m: [15],
    weather_code: [3],
    precipitation_probability: [10],
  },
  daily: {
    time: ['2026-05-12'],
    weather_code: [3],
    temperature_2m_max: [18],
    temperature_2m_min: [10],
    precipitation_sum: [0],
    precipitation_probability_max: [20],
    uv_index_max: [4],
  },
  fetchedAt: 0,
};

interface WeatherBody {
  current: { temperature_2m: number };
  fetchedAt: number;
}

interface ErrorBody {
  error: string;
}

function makeApp(settingsGet: jest.Mock) {
  const repo = { get: settingsGet } as unknown as AppSettingsRepository;
  const app = express();
  app.use(express.json());
  app.use(createWeatherRouter(repo));
  app.use(errorHandler);
  return app;
}

describe('GET /api/v1/weather', () => {
  beforeEach(() => {
    WeatherService.resetForTests();
    jest.restoreAllMocks();
  });

  it('returns 503 when location is not configured', async () => {
    const app = makeApp(jest.fn().mockReturnValue(null));
    const res = await request(app).get('/api/v1/weather');
    expect(res.status).toBe(503);
    expect((res.body as ErrorBody).error).toBe('NO_LOCATION');
  });

  it('returns 503 when weather data is unavailable', async () => {
    const app = makeApp(jest.fn().mockReturnValue({ lat: 51.5, lon: -0.1 }));
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));
    const res = await request(app).get('/api/v1/weather');
    expect(res.status).toBe(503);
    expect((res.body as ErrorBody).error).toBe('WEATHER_UNAVAILABLE');
  });

  it('returns cached weather data when available', async () => {
    const app = makeApp(jest.fn().mockReturnValue({ lat: 51.5, lon: -0.1 }));
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWeatherData),
    } as Response);

    const res = await request(app).get('/api/v1/weather');
    expect(res.status).toBe(200);
    expect((res.body as WeatherBody).current.temperature_2m).toBe(15);
    expect((res.body as WeatherBody).fetchedAt).toBeGreaterThan(0);
  });

  it('returns cached data without re-fetching on subsequent requests', async () => {
    const app = makeApp(jest.fn().mockReturnValue({ lat: 51.5, lon: -0.1 }));
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWeatherData),
    } as Response);

    await request(app).get('/api/v1/weather');
    await request(app).get('/api/v1/weather');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
