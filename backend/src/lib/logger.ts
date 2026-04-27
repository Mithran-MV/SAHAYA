import pino from 'pino';
import { config } from './config';

const isDev = config.nodeEnv === 'development';

export const logger = pino({
  level: config.logLevel,
  base: { service: 'sahaya-backend' },
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname,service',
      },
    },
  }),
});
