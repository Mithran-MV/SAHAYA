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
import { dispatchVolunteerForNeed } from '../pipeline/dispatchVolunteer';
import { handleVolunteerCommand } from '../pipeline/volunteerCommands';
import { getNeed } from '../domain/repo';
import { isFirebaseConfigured } from '../lib/firebase';
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
  const text = typeof Body === 'string' ? Body.trim() : '';

  // Volunteer slash-commands take priority over need extraction.
  if (text.toLowerCase().startsWith('/v')) {
    if (!isFirebaseConfigured()) {
      twiml.message(
        'Volunteer features need Firestore configured. See docs/SETUP.md.',
      );
      return res.type('text/xml').send(twiml.toString());
    }
    try {
      const reply = await handleVolunteerCommand(text.slice(2).trim(), raw);
      twiml.message(reply);
    } catch (err) {
      logger.error({ err }, 'volunteer command failed');
      twiml.message('⚠️ Command failed. Try /v help.');
    }
    return res.type('text/xml').send(twiml.toString());
  }

  // ASHA worker reporting flow.
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
    } else if (text.length > 0) {
      extraction = await extractNeedsFromText(text);
    } else {
      twiml.message(
        '🙏 Welcome to SAHAYA. Send a voice note (Tamil/Hindi/English) describing what you observed today, ' +
          'or type the description as text. Volunteer? Type /v help.',
      );
      return res.type('text/xml').send(twiml.toString());
    }

    const outcome = await processExtraction(extraction, raw);

    let dispatched = 0;
    if (outcome.persisted) {
      for (const id of outcome.savedIds) {
        try {
          const need = await getNeed(id);
          if (!need) continue;
          const result = await dispatchVolunteerForNeed(need);
          if (result.matched) dispatched++;
        } catch (err) {
          logger.error({ err, needId: id }, 'dispatch failed for need');
        }
      }
    }

    twiml.message(
      composeSummary(
        extraction,
        outcome.savedIds.length,
        outcome.geocodedCount,
        dispatched,
        outcome.persisted,
      ),
    );
    return res.type('text/xml').send(twiml.toString());
  } catch (err) {
    logger.error({ err }, 'whatsapp pipeline failed');
    twiml.message('⚠️ Something went wrong processing your message. The team has been notified.');
    return res.type('text/xml').send(twiml.toString());
  }
});

function composeSummary(
  extraction: ExtractionResult,
  persisted: number,
  geocoded: number,
  dispatched: number,
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
    const geoTag = geocoded > 0 ? `, ${geocoded} mapped` : '';
    const dispatchTag =
      dispatched > 0 ? `, ${dispatched} volunteer${dispatched === 1 ? '' : 's'} pinged` : '';
    lines.push(`\n📍 ${persisted} logged${geoTag}${dispatchTag}.`);
  } else {
    lines.push('\n(Preview mode — not persisted.)');
  }
  return lines.join('\n');
}
