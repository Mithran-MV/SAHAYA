import { Router } from 'express';
import { config } from '../lib/config';
import { store } from '../lib/store';

const startedAt = Date.now();

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sahaya-backend',
    env: config.nodeEnv,
    version: process.env.npm_package_version ?? 'dev',
    uptimeMs: Date.now() - startedAt,
    integrations: {
      gemini: Boolean(config.gemini.apiKey),
      maps: Boolean(config.maps.apiKey),
      twilio: Boolean(config.twilio.accountSid && config.twilio.authToken),
    },
    store: store.snapshot(),
  });
});
