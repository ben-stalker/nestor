import { Router } from 'express';
import logger from '../utils/logger';

const clientErrorsRouter = Router();

clientErrorsRouter.post('/api/v1/client-errors', (req, res) => {
  const { message, stack, componentStack, timestamp } = req.body as {
    message?: string;
    stack?: string;
    componentStack?: string;
    timestamp?: string;
  };

  logger.error(
    { clientError: { message, stack, componentStack, timestamp } },
    'Client-side render error reported',
  );

  res.status(204).end();
});

export default clientErrorsRouter;
