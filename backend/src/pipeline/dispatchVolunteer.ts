import { findNearestVolunteer, assignNeedToVolunteer } from '../domain/repo';
import { sendWhatsApp, isTwilioOutboundConfigured } from '../lib/twilioOutbound';
import { haversineKm } from '../lib/geo';
import { logger } from '../lib/logger';
import type { Need } from '../domain/types';

export interface DispatchResult {
  matched: boolean;
  volunteerId: string | null;
  volunteerPublicId: string | null;
  distanceKm: number | null;
  whatsappSid: string | null;
  whatsappError: string | null;
}

const NULL_RESULT: DispatchResult = {
  matched: false,
  volunteerId: null,
  volunteerPublicId: null,
  distanceKm: null,
  whatsappSid: null,
  whatsappError: null,
};

export async function dispatchVolunteerForNeed(
  need: Need,
): Promise<DispatchResult> {
  const volunteer = await findNearestVolunteer(need);
  if (!volunteer) {
    logger.info(
      { needId: need.id, needType: need.needType, urgency: need.urgency },
      'no volunteer match',
    );
    return NULL_RESULT;
  }

  const distanceKm =
    need.location && volunteer.serviceArea
      ? haversineKm(need.location, volunteer.serviceArea)
      : null;

  const where =
    need.location?.formattedAddress ?? need.locationHint ?? 'unspecified location';
  const distanceTag =
    distanceKm !== null ? `${distanceKm.toFixed(1)} km away` : 'distance unknown';

  const message = [
    `🚨 SAHAYA dispatch · ${need.urgency.toUpperCase()}`,
    ``,
    `Type: ${need.needType}${
      need.beneficiaryCount ? ` (${need.beneficiaryCount} ppl)` : ''
    }`,
    `Where: ${where}`,
    `Distance: ${distanceTag}`,
    `Reported: "${need.rawQuote.slice(0, 200)}"`,
    ``,
    `Reply to claim:  /v claim ${need.id}`,
  ].join('\n');

  const sendResult = isTwilioOutboundConfigured()
    ? await sendWhatsApp(volunteer.phone, message)
    : { sid: null, error: 'twilio_not_configured' as string | null };

  await assignNeedToVolunteer(need.id, volunteer.publicId);

  logger.info(
    {
      needId: need.id,
      volunteerId: volunteer.id,
      volunteerPublicId: volunteer.publicId,
      distanceKm,
      sid: sendResult.sid,
    },
    'volunteer dispatched',
  );

  return {
    matched: true,
    volunteerId: volunteer.id,
    volunteerPublicId: volunteer.publicId,
    distanceKm,
    whatsappSid: sendResult.sid,
    whatsappError: sendResult.error,
  };
}
