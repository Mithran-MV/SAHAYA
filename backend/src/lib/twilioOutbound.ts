import twilio, { Twilio } from 'twilio';
import { config } from './config';
import { logger } from './logger';

let _client: Twilio | null = null;
function getClient(): Twilio | null {
  if (!config.twilio.accountSid || !config.twilio.authToken) return null;
  if (!_client) {
    _client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return _client;
}

export function isTwilioOutboundConfigured(): boolean {
  return Boolean(config.twilio.accountSid && config.twilio.authToken);
}

export interface SendResult {
  sid: string | null;
  error: string | null;
}

/**
 * Send a WhatsApp message via Twilio. If Twilio isn't configured, log + skip.
 * Always returns; never throws.
 */
export async function sendWhatsApp(toRaw: string, body: string): Promise<SendResult> {
  const client = getClient();
  if (!client) {
    logger.warn({ to: toRaw }, 'twilio outbound not configured; skipping send');
    return { sid: null, error: 'twilio_not_configured' };
  }
  const to = toRaw.startsWith('whatsapp:') ? toRaw : `whatsapp:${toRaw}`;
  try {
    const message = await client.messages.create({
      from: config.twilio.whatsappFrom,
      to,
      body,
    });
    logger.info({ sid: message.sid, to }, 'whatsapp sent');
    return { sid: message.sid, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: number | string }).code;
    logger.error({ err: msg, to, code }, 'whatsapp send failed');
    return { sid: null, error: msg };
  }
}
