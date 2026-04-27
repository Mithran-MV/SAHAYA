import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('8080').transform((v) => Number.parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PUBLIC_BASE_URL: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  GOOGLE_MAPS_API_KEY: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().default('whatsapp:+14155238886'),
});

const parsed = schema.parse(process.env);

export const config = {
  port: parsed.PORT,
  nodeEnv: parsed.NODE_ENV,
  logLevel: parsed.LOG_LEVEL,
  publicBaseUrl: parsed.PUBLIC_BASE_URL,
  gemini: {
    apiKey: parsed.GEMINI_API_KEY,
  },
  firebase: {
    projectId: parsed.FIREBASE_PROJECT_ID,
    credentialsPath: parsed.GOOGLE_APPLICATION_CREDENTIALS,
  },
  maps: {
    apiKey: parsed.GOOGLE_MAPS_API_KEY,
  },
  twilio: {
    accountSid: parsed.TWILIO_ACCOUNT_SID,
    authToken: parsed.TWILIO_AUTH_TOKEN,
    whatsappFrom: parsed.TWILIO_WHATSAPP_FROM,
  },
} as const;

export type Config = typeof config;
