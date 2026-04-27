import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from '../lib/logger';
import { config } from '../lib/config';
import { ASHAS, NEEDS, VILLAGES, VOLUNTEERS } from './seedData';
import type { GeoLocation, NeedStatus } from '../domain/types';

if (!config.firebase.projectId) {
  console.error('FIREBASE_PROJECT_ID required to seed.');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: config.firebase.projectId,
  });
}

const db = getFirestore();

function digitsOnly(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

interface SeedRefs {
  ashaPublicIds: Record<number, string>;
  ashaDisplayNames: Record<number, string>;
  villageById: Record<string, (typeof VILLAGES)[number]>;
  volunteerPublicIds: string[];
}

async function clearDemoData(): Promise<void> {
  logger.info('clearing demo collections');
  const collections = ['needs', 'resolutions', 'volunteers', 'asha_workers'];
  for (const c of collections) {
    const snap = await db.collection(c).limit(500).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    if (snap.size > 0) await batch.commit();
    logger.info({ collection: c, deleted: snap.size }, 'cleared');
  }
}

async function seedAshas(refs: SeedRefs): Promise<void> {
  const now = Timestamp.now();
  const batch = db.batch();
  ASHAS.forEach((a, i) => {
    const id = digitsOnly(a.phone);
    const publicId = randomUUID();
    refs.ashaPublicIds[i] = publicId;
    refs.ashaDisplayNames[i] = a.name.split(/\s+/)[0];
    batch.set(db.collection('asha_workers').doc(id), {
      id,
      phone: a.phone,
      name: a.name,
      waId: id,
      publicId,
      createdAt: now,
      lastSeenAt: now,
      reportedNeedsCount: 0,
    });
  });
  await batch.commit();
  logger.info({ count: ASHAS.length }, 'seeded asha_workers');
}

async function seedVolunteers(refs: SeedRefs): Promise<void> {
  const now = Timestamp.now();
  const batch = db.batch();
  VOLUNTEERS.forEach((v) => {
    const id = digitsOnly(v.phone);
    const publicId = randomUUID();
    refs.volunteerPublicIds.push(publicId);
    const village = refs.villageById[v.villageId];
    const serviceArea: GeoLocation = {
      lat: village.lat,
      lng: village.lng,
      formattedAddress: `${village.name}, Tamil Nadu`,
    };
    batch.set(db.collection('volunteers').doc(id), {
      id,
      phone: v.phone,
      name: v.name,
      skills: v.skills,
      serviceArea,
      serviceRadiusKm: v.serviceRadiusKm,
      active: true,
      publicId,
      createdAt: now,
    });
  });
  await batch.commit();
  logger.info({ count: VOLUNTEERS.length }, 'seeded volunteers');
}

function nowMinusHours(hours: number): Timestamp {
  return Timestamp.fromMillis(Date.now() - hours * 3_600_000);
}

async function seedNeedsAndResolutions(refs: SeedRefs): Promise<void> {
  const batch = db.batch();
  let needsCreated = 0;
  let resolutionsCreated = 0;

  for (const seed of NEEDS) {
    const village = refs.villageById[seed.villageId];
    const lat = village.lat + (seed.jitter?.lat ?? (Math.random() - 0.5) * 0.02);
    const lng = village.lng + (seed.jitter?.lng ?? (Math.random() - 0.5) * 0.02);
    const location: GeoLocation = {
      lat,
      lng,
      formattedAddress: `${seed.locationHint}, ${village.name}, Tamil Nadu`,
    };

    const createdAt = nowMinusHours(seed.hoursAgo);
    const reporterPublicId = refs.ashaPublicIds[seed.ashaIndex];
    const reporterDisplayName = refs.ashaDisplayNames[seed.ashaIndex];
    const assignedTo =
      seed.assignedVolunteerIndex !== undefined
        ? refs.volunteerPublicIds[seed.assignedVolunteerIndex]
        : null;

    let status: NeedStatus = seed.status;
    let resolvedAt: Timestamp | null = null;
    let verifiedAt: Timestamp | null = null;
    let verifiedPhotoUrl: string | null = null;

    if (seed.status === 'verified' && seed.resolvedHoursLater !== undefined) {
      resolvedAt = nowMinusHours(seed.hoursAgo - seed.resolvedHoursLater);
      verifiedAt = resolvedAt;
      verifiedPhotoUrl = seed.photoUrl ?? null;
    }

    const needRef = db.collection('needs').doc();
    batch.set(needRef, {
      id: needRef.id,
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
    });
    needsCreated++;

    if (
      seed.status === 'verified' &&
      seed.assignedVolunteerIndex !== undefined &&
      seed.resolvedHoursLater !== undefined
    ) {
      const resRef = db.collection('resolutions').doc();
      batch.set(resRef, {
        id: resRef.id,
        needId: needRef.id,
        volunteerPublicId: refs.volunteerPublicIds[seed.assignedVolunteerIndex],
        photoUrl: seed.photoUrl ?? null,
        verified: true,
        verificationConfidence: seed.verificationConfidence ?? 0.8,
        verificationReason: seed.verificationReason ?? null,
        observations: null,
        resolvedAt: resolvedAt!,
      });
      resolutionsCreated++;
    }
  }

  await batch.commit();
  logger.info({ needsCreated, resolutionsCreated }, 'seeded needs + resolutions');
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const wipe = args.has('--wipe') || args.has('-w');

  if (wipe) {
    await clearDemoData();
  }

  const refs: SeedRefs = {
    ashaPublicIds: {},
    ashaDisplayNames: {},
    villageById: Object.fromEntries(VILLAGES.map((v) => [v.id, v])),
    volunteerPublicIds: [],
  };

  await seedAshas(refs);
  await seedVolunteers(refs);
  await seedNeedsAndResolutions(refs);

  logger.info('✅ seed complete');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'seed failed');
  process.exit(1);
});
