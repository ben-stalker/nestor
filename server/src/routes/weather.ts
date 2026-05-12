import { Router } from 'express';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import { LocationSchema } from '../db/settings-keys';
import * as WeatherService from '../services/WeatherService';

export default function createWeatherRouter(settingsRepo: AppSettingsRepository): Router {
  const router = Router();

  router.get('/api/v1/weather', async (_req, res, next) => {
    try {
      const raw = settingsRepo.get('location');
      if (!raw) {
        res.status(503).json({ error: 'NO_LOCATION', message: 'Location not configured' });
        return;
      }

      const parsed = LocationSchema.safeParse(raw);
      if (!parsed.success) {
        res.status(503).json({ error: 'INVALID_LOCATION', message: 'Location setting is invalid' });
        return;
      }

      const data = await WeatherService.getForLocation(parsed.data.lat, parsed.data.lon);
      if (!data) {
        res
          .status(503)
          .json({ error: 'WEATHER_UNAVAILABLE', message: 'Weather data not available' });
        return;
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
