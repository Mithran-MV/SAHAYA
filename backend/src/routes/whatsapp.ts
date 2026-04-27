import { Router } from 'express';
import twilio from 'twilio';
import { logger } from '../lib/logger';

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

  // Phase 2 will route here:
  //   - if voice (audio/ogg, audio/mpeg) -> Gemini transcription + need extraction
  //   - if photo + reply context -> Gemini Vision verification
  //   - if /register, /skills, etc -> volunteer onboarding
  //   - else: gentle help text

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(
    'SAHAYA received your message. The full voice → need pipeline lands in Phase 2. ' +
      'For now, this is a healthy webhook acknowledgement.',
  );

  res.type('text/xml').send(twiml.toString());
});
