import { Router } from 'express';
import { extractNeedsFromText } from '../pipeline/extractNeeds';

export const testRouter = Router();

/**
 * Dev-only: extract structured needs from a text input (no Twilio, no audio).
 * POST /test/extract  { "text": "..." }
 */
testRouter.post('/extract', async (req, res, next) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    if (!text || text.length < 3) {
      return res.status(400).json({ error: 'text required (min 3 chars)' });
    }
    const result = await extractNeedsFromText(text);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
