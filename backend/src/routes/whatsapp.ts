import { Router } from 'express';
import twilio from 'twilio';
import { logger } from '../lib/logger';
import { config } from '../lib/config';
import { downloadTwilioMedia } from '../lib/twilio';
import {
  extractNeedsFromAudio,
  extractNeedsFromText,
} from '../pipeline/extractNeeds';
import { processExtraction } from '../pipeline/processNeeds';
import type { ExtractionResult, RawReporter } from '../domain/types';

export const whatsappRouter = Router();

whatsappRouter.post('/', async (req, res) => {
  const {
    Body,
    From,
    NumMedia,
    MediaUrl0,
    MediaContentType0,
    ProfileName,
    WaId,
  } = req.body ?? {};

  logger.info(
    {
      from: From,
      waId: WaId,
      profileName: ProfileName,
      bodyPreview: typeof Body === 'string' ? Body.slice(0, 120) : null,
      numMedia: NumMedia,
      mediaContentType: MediaContentType0,
      hasMedia: Boolean(MediaUrl0),
    },
    'whatsapp inbound',
  );

  const twiml = new twilio.twiml.MessagingResponse();
  const raw: RawReporter = {
    phone: typeof From === 'string' ? From : 'unknown',
    name: typeof ProfileName === 'string' ? ProfileName : null,
    waId: typeof WaId === 'string' ? WaId : null,
  };

  try {
    if (!config.gemini.apiKey) {
      twiml.message(
        'SAHAYA backend received your message, but the AI pipeline is not configured ' +
          '(missing GEMINI_API_KEY). See docs/SETUP.md.',
      );
      return res.type('text/xml').send(twiml.toString());
    }

    const isAudio =
      typeof MediaContentType0 === 'string' &&
      MediaContentType0.startsWith('audio/') &&
      typeof MediaUrl0 === 'string';

    let extraction: ExtractionResult;
    if (isAudio) {
      const audio = await downloadTwilioMedia(MediaUrl0);
      extraction = await extractNeedsFromAudio({
        data: audio.data,
        mimeType: audio.mimeType,
      });
    } else if (typeof Body === 'string' && Body.trim().length > 0) {
      extraction = await extractNeedsFromText(Body.trim());
    } else {
      twiml.message(
        '🙏 Welcome to SAHAYA. Please send a voice note (in Tamil, Hindi, or English) ' +
          'describing what you observed today, or type the description as text.',
      );
      return res.type('text/xml').send(twiml.toString());
    }

    const outcome = await processExtraction(extraction, raw);
    twiml.message(composeSummary(extraction, outcome.savedIds.length, outcome.geocodedCount, outcome.persisted));
    return res.type('text/xml').send(twiml.toString());
  } catch (err) {
    logger.error({ err }, 'whatsapp pipeline failed');
    twiml.message(
      '⚠️ Something went wrong processing your message. The team has been notified.',
    );
    return res.type('text/xml').send(twiml.toString());
  }
});

function composeSummary(
  extraction: ExtractionResult,
  persisted: number,
  geocoded: number,
  persistedFlag: boolean,
): string {
  if (extraction.needs.length === 0) {
    return `✅ Heard you (${extraction.language.toUpperCase()}). I didn't pick up a specific community need — could you say it again with a bit more detail?`;
  }

  const lines: string[] = [
    `✅ Heard you in ${extraction.language.toUpperCase()}. ${extraction.needs.length} need${extraction.needs.length === 1 ? '' : 's'} detected:`,
  ];
  extraction.needs.slice(0, 5).forEach((n, i) => {
    const where = n.locationHint ? ` @ ${n.locationHint}` : '';
    const count = n.beneficiaryCount ? ` (${n.beneficiaryCount} ppl)` : '';
    lines.push(
      `${i + 1}. ${n.needType.toUpperCase()} · ${n.urgency}${where}${count}`,
    );
  });
  if (extraction.needs.length > 5) {
    lines.push(`…and ${extraction.needs.length - 5} more.`);
  }
  if (persistedFlag) {
    const geoTag = geocoded > 0 ? ` (${geocoded} mapped)` : '';
    lines.push(`\n📍 ${persisted} logged${geoTag}. Volunteers nearby will be notified.`);
  } else {
    lines.push('\n(Preview mode — not persisted.)');
  }
  return lines.join('\n');
}
