import pinoHttp from 'pino-http';
import logger from '../utils/logger';

const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: (req as { id?: string }).id,
  }),
  serializers: {
    req(req: { method: string; url: string; id?: string }) {
      return { method: req.method, url: req.url, requestId: req.id };
    },
    res(res: { statusCode: number }) {
      return { statusCode: res.statusCode };
    },
  },
});

export default httpLogger;
