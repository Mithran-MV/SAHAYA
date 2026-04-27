import { Router } from 'express';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { getResolution } from '../domain/repo';

export const mediaRouter = Router();

/**
 * Proxy a verification photo from Twilio with the appropriate Basic auth.
 *
 * Why: Twilio media URLs require Account-SID + Auth-Token Basic auth to access,
 * so the dashboard can't link to them directly. We store the original Twilio URL
 * server-side and expose `/media/<resolutionId>` as a public-readable proxy.
 *
 * Seed data uses Unsplash URLs which are public — those bypass this route entirely
 * and are returned as-is by /api/needs and /api/resolutions.
 */
mediaRouter.get('/:resolutionId', async (req, res) => {
  const r = await getResolution(req.params.resolutionId);
  if (!r) {
    res.status(404).json({ error: 'resolution_not_found' });
    return;
  }
  if (!r.twilioMediaUrl) {
    // Seed data or already-public URL — redirect to the original.
    if (r.photoUrl) {
      res.redirect(302, r.photoUrl);
      return;
    }
    res.status(404).json({ error: 'no_photo' });
    return;
  }
  if (!config.twilio.accountSid || !config.twilio.authToken) {
    res.status(500).json({ error: 'twilio_not_configured' });
    return;
  }
  const auth = Buffer.from(
    `${config.twilio.accountSid}:${config.twilio.authToken}`,
  ).toString('base64');

  try {
    const upstream = await fetch(r.twilioMediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
      redirect: 'follow',
    });
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ error: 'upstream_failed', status: upstream.status });
      return;
    }
    const ct = upstream.headers.get('content-type') ?? r.twilioMediaContentType ?? 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    logger.error({ err, resolutionId: req.params.resolutionId }, 'media proxy failed');
    res.status(500).json({ error: 'proxy_failed' });
  }
});
