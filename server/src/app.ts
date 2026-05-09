import express, { type Express } from 'express';
import errorHandler from './middleware/errorHandler';
import httpLogger from './middleware/logger';
import requestId from './middleware/requestId';
import healthRouter from './routes/health';

export default function createApp(): Express {
  const app = express();

  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json({ limit: '10mb' }));

  app.use(healthRouter);

  app.use(errorHandler);

  return app;
}
