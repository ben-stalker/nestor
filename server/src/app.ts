import fs from 'fs';
import path from 'path';
import express, { type Express } from 'express';
import errorHandler from './middleware/errorHandler';
import httpLogger from './middleware/logger';
import requestId from './middleware/requestId';
import { getDb } from './db/connection';
import ProfileRepository from './repositories/ProfileRepository';
import clientErrorsRouter from './routes/clientErrors';
import healthRouter from './routes/health';
import createProfilesRouter from './routes/profiles';

const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export default function createApp(): Express {
  const app = express();

  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json({ limit: '10mb' }));

  app.use(healthRouter);
  app.use(clientErrorsRouter);
  app.use('/api/v1/profiles', createProfilesRouter(new ProfileRepository(getDb())));

  if (process.env.NODE_ENV === 'production' && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
