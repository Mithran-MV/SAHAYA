import { randomUUID } from 'node:crypto';
import { store } from './store';
import { logger } from './logger';
import { ASHAS, NEEDS, VILLAGES, VOLUNTEERS } from '../scripts/seedData';
import type {
  AshaWorker,
  GeoLocation,
  Need,
  NeedStatus,
  Resolution,
  Volunteer,
} from '../domain/types';

function digitsOnly(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function isoMinusHours(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

/**
 * Populate the in-memory store from seedData. Idempotent — safe to call multiple
 * times; later calls reset and re-seed for a clean state.
 */
export function seedInMemoryStore(): void {
  store.reset();

  const villageById = Object.fromEntries(VILLAGES.map((v) => [v.id, v]));

  // 1. ASHA workers
  const ashaPublicIds: Record<number, string> = {};
  const ashaDisplayNames: Record<number, string> = {};

  ASHAS.forEach((a, i) => {
    const id = digitsOnly(a.phone);
    const publicId = randomUUID();
    ashaPublicIds[i] = publicId;
    ashaDisplayNames[i] = a.name.split(/\s+/)[0];
    const now = new Date().toISOString();
    const worker: AshaWorker = {
      id,
      phone: a.phone,
      name: a.name,
      waId: id,
      publicId,
      createdAt: now,
      lastSeenAt: now,
      reportedNeedsCount: 0,
    };
    store.ashaWorkers.set(id, worker);
  });

  // 2. Volunteers
  const volunteerPublicIds: string[] = [];
  VOLUNTEERS.forEach((v) => {
    const id = digitsOnly(v.phone);
    const publicId = randomUUID();
    volunteerPublicIds.push(publicId);
    const village = villageById[v.villageId];
    const serviceArea: GeoLocation = {
      lat: village.lat,
      lng: village.lng,
      formattedAddress: `${village.name}, Tamil Nadu`,
    };
    const volunteer: Volunteer = {
      id,
      phone: v.phone,
      name: v.name,
      skills: v.skills,
      serviceArea,
      serviceRadiusKm: v.serviceRadiusKm,
      active: true,
      publicId,
      createdAt: new Date().toISOString(),
    };
    store.volunteers.set(id, volunteer);
  });

  // 3. Needs + resolutions
  for (const seed of NEEDS) {
    const village = villageById[seed.villageId];
    const lat = village.lat + (seed.jitter?.lat ?? (Math.random() - 0.5) * 0.02);
    const lng = village.lng + (seed.jitter?.lng ?? (Math.random() - 0.5) * 0.02);
    const location: GeoLocation = {
      lat,
      lng,
      formattedAddress: `${seed.locationHint}, ${village.name}, Tamil Nadu`,
    };

    const createdAt = isoMinusHours(seed.hoursAgo);
    const reporterPublicId = ashaPublicIds[seed.ashaIndex];
    const reporterDisplayName = ashaDisplayNames[seed.ashaIndex];
    const assignedTo =
      seed.assignedVolunteerIndex !== undefined
        ? volunteerPublicIds[seed.assignedVolunteerIndex]
        : null;

    const status: NeedStatus = seed.status;
    let resolvedAt: string | null = null;
    let verifiedAt: string | null = null;
    let verifiedPhotoUrl: string | null = null;

    if (seed.status === 'verified' && seed.resolvedHoursLater !== undefined) {
      resolvedAt = isoMinusHours(seed.hoursAgo - seed.resolvedHoursLater);
      verifiedAt = resolvedAt;
      verifiedPhotoUrl = seed.photoUrl ?? null;
    }

    const id = randomUUID();
    const need: Need = {
      id,
      reporter: {
        publicId: reporterPublicId,
        displayName: reporterDisplayName,
      },
      rawText: seed.rawText,
      rawQuote: seed.rawQuote,
      needType: seed.needType,
      urgency: seed.urgency,
      locationHint: seed.locationHint,
      location,
      beneficiaryCount: seed.beneficiaryCount ?? null,
      language: seed.language,
      status,
      assignedTo,
      reasoning: seed.reasoning,
      verifiedPhotoUrl,
      verifiedAt,
      latestPhotoUrl: verifiedPhotoUrl,
      createdAt,
      updatedAt: resolvedAt ?? createdAt,
      resolvedAt,
    };
    store.needs.set(id, need);

    if (
      seed.status === 'verified' &&
      seed.assignedVolunteerIndex !== undefined &&
      seed.resolvedHoursLater !== undefined
    ) {
      const resId = randomUUID();
      const resolution: Resolution = {
        id: resId,
        needId: id,
        volunteerPublicId: volunteerPublicIds[seed.assignedVolunteerIndex],
        photoUrl: seed.photoUrl ?? null,
        twilioMediaUrl: null,
        twilioMediaContentType: null,
        verified: true,
        verificationConfidence: seed.verificationConfidence ?? 0.8,
        verificationReason: seed.verificationReason ?? null,
        observations: null,
        resolvedAt: resolvedAt!,
      };
      store.resolutions.set(resId, resolution);
    }
  }

  store.markSeeded();
  logger.info('demo seed loaded into in-memory store');
}
