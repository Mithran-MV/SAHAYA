import { config } from './config';
import { logger } from './logger';

export interface DownloadedMedia {
  data: Buffer;
  mimeType: string;
}

/**
 * Twilio media URLs require HTTP Basic auth using the Account SID + Auth Token.
 * After authenticating, Twilio 302-redirects to a short-lived signed URL on its CDN.
 */
export async function downloadTwilioMedia(url: string): Promise<DownloadedMedia> {
  const sid = config.twilio.accountSid;
  const token = config.twilio.authToken;
  if (!sid || !token) {
    throw new Error('Twilio credentials not configured');
  }
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Twilio media fetch failed: ${res.status} ${res.statusText}`);
  }
  const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
  const buf = Buffer.from(await res.arrayBuffer());
  logger.info({ bytes: buf.length, mimeType }, 'downloaded twilio media');
  return { data: buf, mimeType };
}
