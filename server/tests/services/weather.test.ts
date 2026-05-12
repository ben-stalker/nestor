import eventBus from '../../src/core/eventBus';
import * as WeatherService from '../../src/services/WeatherService';

const mockWeatherData: WeatherService.WeatherData = {
  current: { temperature_2m: 15, weather_code: 3, wind_speed_10m: 10, precipitation: 0 },
  hourly: {
    time: ['2026-05-12T00:00', '2026-05-12T01:00'],
    temperature_2m: [14, 15],
    weather_code: [3, 3],
    precipitation_probability: [10, 20],
  },
  daily: {
    time: ['2026-05-12'],
    weather_code: [3],
    temperature_2m_max: [18],
    temperature_2m_min: [10],
    precipitation_sum: [0],
    precipitation_probability_max: [20],
  },
  fetchedAt: 0,
};

function mockSuccessfulFetch(): void {
  jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockWeatherData),
  } as Response);
}

describe('WeatherService', () => {
  beforeEach(() => {
    WeatherService.resetForTests();
    jest.restoreAllMocks();
  });

  describe('getCached', () => {
    it('returns null when no data has been fetched', () => {
      expect(WeatherService.getCached()).toBeNull();
    });
  });

  describe('refresh', () => {
    it('populates the cache on successful fetch', async () => {
      mockSuccessfulFetch();
      await WeatherService.refresh(51.5, -0.1);

      const cached = WeatherService.getCached();
      expect(cached).not.toBeNull();
      expect(cached!.current.temperature_2m).toBe(15);
      expect(cached!.fetchedAt).toBeGreaterThan(0);
    });

    it('serves stale cache if fetch fails', async () => {
      mockSuccessfulFetch();
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));

      await WeatherService.refresh(51.5, -0.1);
      const first = WeatherService.getCached();
      await WeatherService.refresh(51.5, -0.1);
      const second = WeatherService.getCached();

      expect(second).toBe(first);
    });

    it('does not emit alert before 6h threshold', async () => {
      const emit = jest.spyOn(eventBus, 'emit');
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'));

      await WeatherService.refresh(51.5, -0.1);
      expect(emit).not.toHaveBeenCalledWith('alert:new', expect.anything());
    });

    it('only fires the alert once even with repeated failures', async () => {
      const emitCalls: string[] = [];
      jest.spyOn(eventBus, 'emit').mockImplementation((event) => {
        emitCalls.push(event as string);
        return true;
      });

      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'));

      const dateSpy = jest.spyOn(Date, 'now');
      dateSpy.mockReturnValue(0);
      await WeatherService.refresh(51.5, -0.1);

      dateSpy.mockReturnValue(7 * 60 * 60 * 1000);
      await WeatherService.refresh(51.5, -0.1);
      await WeatherService.refresh(51.5, -0.1);

      const weatherAlerts = emitCalls.filter((e) => e === 'alert:new');
      expect(weatherAlerts).toHaveLength(1);
    });

    it('resets failure state after a successful refresh', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherData),
        } as Response);

      await WeatherService.refresh(51.5, -0.1);
      await WeatherService.refresh(51.5, -0.1);

      expect(WeatherService.getCached()).not.toBeNull();
    });

    it('keeps null cache when Open-Meteo returns non-ok status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response);
      await WeatherService.refresh(51.5, -0.1);
      expect(WeatherService.getCached()).toBeNull();
    });
  });

  describe('getForLocation', () => {
    it('returns cached data if already populated', async () => {
      mockSuccessfulFetch();
      await WeatherService.refresh(51.5, -0.1);
      const result = await WeatherService.getForLocation(51.5, -0.1);
      expect(result).not.toBeNull();
    });

    it('fetches on first call when cache is empty', async () => {
      mockSuccessfulFetch();
      const result = await WeatherService.getForLocation(51.5, -0.1);
      expect(result).not.toBeNull();
      expect(result!.current.temperature_2m).toBe(15);
    });

    it('returns null when fetch fails and cache is empty', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));
      const result = await WeatherService.getForLocation(51.5, -0.1);
      expect(result).toBeNull();
    });
  });
});
