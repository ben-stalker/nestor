import fs from 'fs';
import path from 'path';
import express, { type Express } from 'express';
import errorHandler from './middleware/errorHandler';
import httpLogger from './middleware/logger';
import requestId from './middleware/requestId';
import createRequireAdminPin from './middleware/requireAdminPin';
import createKioskLockMiddleware from './middleware/kioskLock';
import { getDb } from './db/connection';
import AppSettingsRepository from './repositories/AppSettingsRepository';
import ProfileRepository from './repositories/ProfileRepository';
import clientErrorsRouter from './routes/clientErrors';
import healthRouter from './routes/health';
import createProfilesRouter from './routes/profiles';
import settingsRouter from './routes/settings';
import createAdminRouter from './routes/admin';
import createWeatherRouter from './routes/weather';
import createHomeRouter from './routes/home';
import createAlertsRouter from './routes/alerts';
import AlertRepository from './repositories/AlertRepository';
import createJourneysRouter from './routes/journeys';
import JourneyRepository from './repositories/JourneyRepository';
import createCalendarRouter from './routes/calendar';
import EventRepository from './repositories/EventRepository';

const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export default function createApp(): Express {
  const app = express();

  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json({ limit: '10mb' }));

  const db = getDb();
  const profileRepo = new ProfileRepository(db);
  const settingsRepo = new AppSettingsRepository(db);
  const alertRepo = new AlertRepository(db);
  const journeyRepo = new JourneyRepository(db);
  const eventRepo = new EventRepository(db);

  const requireAdminPin = createRequireAdminPin(profileRepo);
  const kioskLock = createKioskLockMiddleware(settingsRepo);

  app.use(healthRouter);
  app.use(clientErrorsRouter);
  app.use(
    '/api/v1/profiles',
    createProfilesRouter(profileRepo, undefined, [kioskLock, requireAdminPin]),
  );
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/admin', createAdminRouter(settingsRepo, profileRepo));
  app.use(createWeatherRouter(settingsRepo));
  app.use(createHomeRouter());
  app.use(createAlertsRouter(alertRepo));
  app.use(createJourneysRouter(journeyRepo));
  app.use(createCalendarRouter(eventRepo, profileRepo));

  if (process.env.NODE_ENV === 'production' && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
