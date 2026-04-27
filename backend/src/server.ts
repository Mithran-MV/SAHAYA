import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { config } from './lib/config';
import { healthRouter } from './routes/health';
import { whatsappRouter } from './routes/whatsapp';
import { testRouter } from './routes/test';

export function createServer(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.use('/health', healthRouter);
  app.use('/whatsapp', whatsappRouter);
  if (config.nodeEnv !== 'production') {
    app.use('/test', testRouter);
  }

  app.get('/', (_req, res) => {
    res.json({
      service: 'sahaya-backend',
      message: 'voice-first community needs intelligence',
      docs: 'https://github.com/Mithran-MV/SAHAYA',
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      logger.error({ err, path: req.path }, 'request failed');
      res.status(500).json({ error: 'internal_error' });
    },
  );

  return app;
}
