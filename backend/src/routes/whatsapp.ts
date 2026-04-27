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
import { verifyResolutionPhoto } from '../pipeline/verifyResolution';
import {
  findLatestActiveNeedForVolunteer,
  getNeed,
  getVolunteerByPhone,
  saveResolution,
} from '../domain/repo';
import { isFirebaseConfigured } from '../lib/firebase';
import { uploadPhoto } from '../lib/storage';
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
  if (text.toLowerCase().startsWith('/v') && !isImageMedia(MediaContentType0)) {
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

  // Photo path: volunteer submitting resolution evidence.
  if (isImageMedia(MediaContentType0) && typeof MediaUrl0 === 'string') {
    if (!isFirebaseConfigured()) {
      twiml.message('Photo verification needs Firestore + Storage. See docs/SETUP.md.');
      return res.type('text/xml').send(twiml.toString());
    }
    if (!config.gemini.apiKey) {
      twiml.message('Photo verification needs GEMINI_API_KEY. See docs/SETUP.md.');
      return res.type('text/xml').send(twiml.toString());
    }
    try {
      const reply = await handlePhotoSubmission({
        mediaUrl: MediaUrl0,
        captionText: text,
        raw,
      });
      twiml.message(reply);
    } catch (err) {
      logger.error({ err }, 'photo verification failed');
      twiml.message('⚠️ Could not process the photo. Please try again or contact support.');
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

function isImageMedia(contentType: unknown): contentType is string {
  return typeof contentType === 'string' && contentType.startsWith('image/');
}

interface PhotoSubmissionInput {
  mediaUrl: string;
  captionText: string;
  raw: RawReporter;
}

async function handlePhotoSubmission(
  input: PhotoSubmissionInput,
): Promise<string> {
  const v = await getVolunteerByPhone(input.raw.phone);
  if (!v) {
    return 'Photos are processed for registered volunteers. Use /v register first, then /v claim <needId>, then send the photo.';
  }

  // Resolve target need: explicit caption "/v done <id>" wins; else most recent active need.
  let targetNeedId: string | null = null;
  const captionLower = input.captionText.toLowerCase();
  if (captionLower.startsWith('/v done ') || captionLower.startsWith('/v verify ')) {
    const parts = input.captionText.trim().split(/\s+/);
    if (parts.length >= 3) targetNeedId = parts[2];
  }
  if (!targetNeedId) {
    const latest = await findLatestActiveNeedForVolunteer(v.publicId);
    if (latest) targetNeedId = latest.id;
  }
  if (!targetNeedId) {
    return "Couldn't find a need to verify. Use /v claim <needId> first, then send the photo.";
  }

  const need = await getNeed(targetNeedId);
  if (!need) return `Need ${targetNeedId} not found.`;

  const photo = await downloadTwilioMedia(input.mediaUrl);
  const verification = await verifyResolutionPhoto(
    { data: photo.data, mimeType: photo.mimeType },
    need,
  );

  const objectPath = `resolutions/${targetNeedId}/${Date.now()}.${guessExtension(photo.mimeType)}`;
  const photoUrl = await uploadPhoto(photo.data, photo.mimeType, objectPath);

  await saveResolution({
    needId: targetNeedId,
    volunteerPublicId: v.publicId,
    photoUrl,
    verification: {
      verified: verification.verified,
      confidence: verification.confidence,
      reason: verification.reason,
      observations: verification.observations ?? null,
    },
  });

  const conf = (verification.confidence * 100).toFixed(0);
  if (verification.verified) {
    return [
      `✅ VERIFIED (${conf}% confidence)`,
      verification.reason,
      ``,
      `Need ${targetNeedId} marked resolved. Thank you 🙏`,
    ].join('\n');
  }
  return [
    `⚠️ Could not verify (${conf}% confidence)`,
    verification.reason,
    ``,
    `Need ${targetNeedId} is still in progress. Send a clearer photo or /v release ${targetNeedId} to release it.`,
  ].join('\n');
}

function guessExtension(mimeType: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  return 'bin';
}

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
